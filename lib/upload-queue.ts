export interface UploadItem {
  id: string;
  file: File;
  version: string;
  platform: string;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
  error?: string;
}

export interface UploadQueueOptions {
  maxConcurrent?: number;
  onProgress?: (items: UploadItem[]) => void;
  onItemComplete?: (item: UploadItem) => void;
  onItemError?: (item: UploadItem) => void;
}

export class UploadQueue {
  private items: Map<string, UploadItem> = new Map();
  private queue: string[] = [];
  private uploading: Set<string> = new Set();
  private maxConcurrent: number;
  private onProgress?: (items: UploadItem[]) => void;
  private onItemComplete?: (item: UploadItem) => void;
  private onItemError?: (item: UploadItem) => void;

  constructor(options: UploadQueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrent || 2;
    this.onProgress = options.onProgress;
    this.onItemComplete = options.onItemComplete;
    this.onItemError = options.onItemError;
  }

  addItem(file: File, version: string, platform: string): string {
    const id = `${Date.now()}-${Math.random()}`;
    const item: UploadItem = {
      id,
      file,
      version,
      platform,
      status: "pending",
      progress: 0,
    };
    this.items.set(id, item);
    this.queue.push(id);
    this.notifyProgress();
    return id;
  }

  getItems(): UploadItem[] {
    return Array.from(this.items.values());
  }

  async processQueue(uploadFn: (item: UploadItem) => Promise<void>): Promise<void> {
    while (this.queue.length > 0 || this.uploading.size > 0) {
      // Start new uploads up to maxConcurrent limit
      while (this.uploading.size < this.maxConcurrent && this.queue.length > 0) {
        const itemId = this.queue.shift();
        if (itemId) {
          this.uploading.add(itemId);
          const item = this.items.get(itemId);
          if (item) {
            item.status = "uploading";
            this.notifyProgress();
            
            this.uploadItem(itemId, uploadFn)
              .then(() => {
                item.status = "completed";
                this.onItemComplete?.(item);
              })
              .catch((err) => {
                item.status = "failed";
                item.error = err.message;
                this.onItemError?.(item);
              })
              .finally(() => {
                this.uploading.delete(itemId);
                this.notifyProgress();
              });
          }
        }
      }

      // Wait a bit before checking again
      if (this.uploading.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  private async uploadItem(itemId: string, uploadFn: (item: UploadItem) => Promise<void>): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) return;

    try {
      await uploadFn(item);
    } catch (error) {
      throw error;
    }
  }

  updateProgress(itemId: string, progress: number): void {
    const item = this.items.get(itemId);
    if (item) {
      item.progress = Math.min(100, progress);
      this.notifyProgress();
    }
  }

  removeItem(itemId: string): void {
    this.items.delete(itemId);
    this.queue = this.queue.filter((id) => id !== itemId);
  }

  clear(): void {
    this.items.clear();
    this.queue = [];
  }

  private notifyProgress(): void {
    if (this.onProgress) {
      this.onProgress(this.getItems());
    }
  }

  isEmpty(): boolean {
    return this.items.size === 0;
  }

  getOverallProgress(): number {
    const items = this.getItems();
    if (items.length === 0) return 0;
    const totalProgress = items.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(totalProgress / items.length);
  }
}
