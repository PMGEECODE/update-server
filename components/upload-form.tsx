"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { UploadQueue, type UploadItem } from "@/lib/upload-queue";

interface UploadFormProps {
  onUploadSuccess: () => void;
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [version, setVersion] = useState("");
  const [platform, setPlatform] = useState("win32");
  const [loading, setLoading] = useState(false);
  const [queueItems, setQueueItems] = useState<UploadItem[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (files.length === 0 || !version || !platform) {
      setError("Please fill in all fields and select at least one file");
      return;
    }

    setLoading(true);
    const queue = new UploadQueue({
      maxConcurrent: 2,
      onProgress: (items) => setQueueItems([...items]),
      onItemError: (item) => {
        console.error(`Upload failed for ${item.file.name}:`, item.error);
      },
    });

    let successCount = 0;
    const totalFiles = files.length;

    try {
      // Add all files to queue
      files.forEach((file) => {
        queue.addItem(file, version, platform);
      });

      // Process queue
      await queue.processQueue(async (item) => {
        try {
          // Calculate checksum
          const arrayBuffer = await item.file.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest("SHA-512", arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const checksum = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          const blobPath = `/releases/${item.platform}/${item.version}/${item.file.name}`;

          // Upload to Vercel Blob
          const blob = await upload(blobPath, item.file, {
            access: "public",
            handleUploadUrl: "/api/blob",
            // @ts-ignore
            onUploadProgress: (progressEvent: any) => {
              queue.updateProgress(item.id, progressEvent.percentage);
            },
          } as any);

          // Save to database
          const response = await fetch("/api/releases/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              version: item.version,
              platform: item.platform,
              filename: item.file.name,
              blob_url: blob.url,
              checksum,
              file_size: item.file.size,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Database save failed");
          }

          successCount++;
          queue.updateProgress(item.id, 100);
        } catch (err: any) {
          throw err;
        }
      });

      if (successCount === totalFiles) {
        setSuccess(`Successfully uploaded ${successCount} file(s)!`);
        setFiles([]);
        setVersion("");
        onUploadSuccess();
      } else {
        setSuccess(
          `Uploaded ${successCount}/${totalFiles} files. Check console for errors.`,
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(`Upload error: ${err.message || "Check console"}`);
    } finally {
      setLoading(false);
      setQueueItems([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const overallProgress = queueItems.length > 0
    ? Math.round(
        queueItems.reduce((sum, item) => sum + item.progress, 0) /
          queueItems.length,
      )
    : 0;

  return (
    <form
      onSubmit={handleUpload}
      className="bg-secondary p-6 rounded-lg space-y-4"
    >
      <h2 className="text-xl font-semibold">Upload Release</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
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
          disabled={loading}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 text-foreground"
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
          disabled={loading}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 text-foreground"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="files" className="block text-sm font-medium mb-2">
            Binary Files (multiple)
          </label>
          {files.length > 0 && (
            <button
              type="button"
              onClick={() => setFiles([])}
              disabled={loading}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
            >
              Clear All
            </button>
          )}
        </div>
        <input
          id="files"
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={loading}
          className="w-full bg-background border border-border rounded-lg text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
        />
        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-background/50 p-2 rounded text-sm"
              >
                <span className="text-foreground/80 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
            <p className="text-xs text-foreground/60">
              {files.length} file(s) selected
            </p>
          </div>
        )}
      </div>

      {loading && queueItems.length > 0 && (
        <div className="space-y-3 bg-background/50 p-4 rounded-lg">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Overall Progress</span>
              <span className="font-medium">{overallProgress}%</span>
            </div>
            <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-2">
            {queueItems.map((item) => (
              <div key={item.id} className="text-xs">
                <div className="flex justify-between mb-1">
                  <span className="truncate text-foreground/80">
                    {item.file.name}
                  </span>
                  <span
                    className={`font-medium ${
                      item.status === "completed"
                        ? "text-green-600"
                        : item.status === "failed"
                          ? "text-red-600"
                          : item.status === "uploading"
                            ? "text-blue-600"
                            : "text-foreground/60"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="w-full bg-black/10 dark:bg-white/10 rounded h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded transition-all duration-200 ${
                      item.status === "completed"
                        ? "bg-green-500"
                        : item.status === "failed"
                          ? "bg-red-500"
                          : "bg-blue-500"
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || files.length === 0}
        className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? `Uploading ${overallProgress}%...`
          : `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`}
      </button>
    </form>
  );
}
