"use client";

import { useEffect, useState } from "react";

interface StorageMetrics {
  totalBytes: number;
  usedBytes: number;
  remainingBytes: number;
  percentageUsed: number;
  releaseCount: number;
}

interface StorageMetricsProps {
  refreshTrigger?: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function StorageMetrics({ refreshTrigger = 0 }: StorageMetricsProps) {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/storage/metrics");
      if (!response.ok) {
        throw new Error("Failed to fetch storage metrics");
      }
      const data = await response.json();
      setMetrics(data);
      setError("");
    } catch (err) {
      setError("Failed to load storage metrics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-secondary p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Storage Metrics</h2>
        <p className="text-foreground/60">Loading...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-secondary p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Storage Metrics</h2>
        <p className="text-red-600">{error || "No data available"}</p>
      </div>
    );
  }

  const warningThreshold = 0.8; // 80% warning level
  const errorThreshold = 0.95; // 95% error level
  let statusColor = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  let statusText = "Healthy";

  if (metrics.percentageUsed >= errorThreshold) {
    statusColor = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    statusText = "Critical";
  } else if (metrics.percentageUsed >= warningThreshold) {
    statusColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    statusText = "Warning";
  }

  return (
    <div className="bg-secondary p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Storage Metrics</h2>
        <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${statusColor}`}>
          {statusText}
        </span>
      </div>

      {/* Storage Gauge */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Used Storage</span>
          <span className="text-foreground/60">
            {formatBytes(metrics.usedBytes)} / {formatBytes(metrics.totalBytes)}
          </span>
        </div>
        <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              metrics.percentageUsed >= errorThreshold
                ? "bg-red-500"
                : metrics.percentageUsed >= warningThreshold
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${metrics.percentageUsed}%` }}
          />
        </div>
        <p className="text-xs text-foreground/60">
          {metrics.percentageUsed.toFixed(1)}% used
        </p>
      </div>

      {/* Remaining Space */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-background/50 p-3 rounded">
          <p className="text-foreground/60 text-xs mb-1">Remaining</p>
          <p className="font-semibold">{formatBytes(metrics.remainingBytes)}</p>
        </div>
        <div className="bg-background/50 p-3 rounded">
          <p className="text-foreground/60 text-xs mb-1">Releases</p>
          <p className="font-semibold">{metrics.releaseCount}</p>
        </div>
      </div>

      {metrics.percentageUsed >= warningThreshold && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded text-sm">
          Storage is nearly full. Consider deleting older releases to free up space.
        </div>
      )}
    </div>
  );
}
