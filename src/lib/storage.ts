/**
 * Storage adapter — abstraction over local filesystem (dev) and Netlify Blobs
 * (production). Swap drivers via STORAGE_DRIVER env var.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface StoredFile {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

export interface StorageDriver {
  put(opts: {
    folder: string;
    filename: string;
    contentType: string;
    body: Buffer | Uint8Array;
  }): Promise<StoredFile>;
}

class LocalDriver implements StorageDriver {
  private root: string;
  constructor(root: string = path.join(process.cwd(), ".uploads")) {
    this.root = root;
  }

  async put({ folder, filename, contentType, body }: Parameters<StorageDriver["put"]>[0]) {
    const safeName = sanitize(filename);
    const id = crypto.randomBytes(8).toString("hex");
    const relPath = path.posix.join(folder, `${id}-${safeName}`);
    const absPath = path.join(this.root, relPath);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, body);
    return {
      key: relPath,
      // In dev we serve uploads via an API route — see /api/files/[...path]
      url: `/api/files/${relPath}`,
      contentType,
      size: body.byteLength,
    };
  }
}

class NetlifyBlobsDriver implements StorageDriver {
  private store: string;
  constructor(store = "asi-cayman") {
    this.store = store;
  }
  async put({ folder, filename, contentType, body }: Parameters<StorageDriver["put"]>[0]) {
    // Lazy-import to keep local dev working without the package installed errors
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: this.store, consistency: "strong" });
    const safeName = sanitize(filename);
    const id = crypto.randomBytes(8).toString("hex");
    const key = path.posix.join(folder, `${id}-${safeName}`);
    await store.set(key, body, { metadata: { contentType } });
    return {
      key,
      url: `/api/files/${key}`,
      contentType,
      size: body.byteLength,
    };
  }
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function getStorage(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? (process.env.NETLIFY ? "netlify-blobs" : "local");
  return driver === "netlify-blobs" ? new NetlifyBlobsDriver() : new LocalDriver();
}

export const ALLOWED_RECEIPT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
  "application/pdf",
]);
export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024; // 8 MB
