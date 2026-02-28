"use client";

import { useEffect, useState } from "react";

interface Release {
  id: string;
  version: string;
  platform: string;
  filename: string;
  blob_url: string;
  checksum: string;
  file_size: number;
  published: boolean;
  published_at: string | null;
  created_at: string;
  created_by: string;
}

interface ReleasesListProps {
  refreshTrigger: number;
}

export function ReleasesList({ refreshTrigger }: ReleasesListProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/releases/upload");
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          `Failed to fetch releases: ${data?.error || response.statusText}`,
        );
        return;
      }
      const data = await response.json();
      setReleases(data);
      setError("");
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, [refreshTrigger]);

  const handlePublish = async (releaseId: string, platform: string) => {
    try {
      const response = await fetch("/api/releases/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ releaseId, platform }),
      });

      if (!response.ok) {
        alert("Failed to publish release");
        return;
      }

      fetchReleases();
    } catch (err) {
      alert("An unexpected error occurred");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading releases...</div>;
  }

  if (error) {
    return <div className="text-red-600 py-8">{error}</div>;
  }

  if (releases.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/60">No releases yet</div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">All Releases</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold">Version</th>
              <th className="text-left py-3 px-4 font-semibold">Platform</th>
              <th className="text-left py-3 px-4 font-semibold">File</th>
              <th className="text-left py-3 px-4 font-semibold">Size</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-left py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((release) => (
              <tr
                key={release.id}
                className="border-b border-border hover:bg-secondary/50"
              >
                <td className="py-3 px-4 font-mono text-sm">
                  {release.version}
                </td>
                <td className="py-3 px-4">{release.platform}</td>
                <td className="py-3 px-4">
                  <a
                    href={release.blob_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm truncate block"
                  >
                    {release.filename}
                  </a>
                </td>
                <td className="py-3 px-4 text-sm">
                  {(release.file_size / 1024 / 1024).toFixed(2)} MB
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      release.published
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {release.published ? "Published" : "Unpublished"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {!release.published && (
                    <button
                      onClick={() =>
                        handlePublish(release.id, release.platform)
                      }
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Publish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
