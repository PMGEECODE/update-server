"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";

interface UploadFormProps {
  onUploadSuccess: () => void;
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [platform, setPlatform] = useState("win32");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!file || !version || !platform) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // 1. Calculate File Checksum safely in the browser
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const blobPath = `/releases/${platform}/${version}/${file.name}`;

      // 2. Direct-to-Edge Vercel Blob Upload (Bypasses 4MB limit)
      const blob = await upload(blobPath, file, {
        access: "public",
        handleUploadUrl: "/api/blob",
      });

      // 3. Save release metadata in the database
      const response = await fetch("/api/releases/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          platform,
          filename: file.name,
          blob_url: blob.url,
          checksum,
          file_size: file.size,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Database save failed");
        return;
      }

      setSuccess("File uploaded successfully!");
      setFile(null);
      setVersion("");
      onUploadSuccess();
    } catch (err: any) {
      console.error(err);
      setError(
        `An unexpected error occurred: ${err.message || "Check console"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleUpload}
      className="bg-secondary p-6 rounded-lg space-y-4"
    >
      <h2 className="text-xl font-semibold">Upload Release</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div>
        <label htmlFor="platform" className="block text-sm font-medium mb-2">
          Platform
        </label>
        <select
          id="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="win32">Windows (win32)</option>
          <option value="darwin">macOS (darwin)</option>
          <option value="linux">Linux</option>
        </select>
      </div>

      <div>
        <label htmlFor="version" className="block text-sm font-medium mb-2">
          Version
        </label>
        <input
          id="version"
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="1.0.0"
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium mb-2">
          Binary File
        </label>
        <input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full"
        />
        {file && <p className="text-sm text-foreground/60 mt-2">{file.name}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Release"}
      </button>
    </form>
  );
}
