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

export interface StoredObject {
  /** Ready to hand straight to a Response body. */
  body: ReadableStream<Uint8Array> | Buffer;
  contentType: string;
}

export interface StorageDriver {
  put(opts: {
    folder: string;
    filename: string;
    contentType: string;
    body: Buffer | Uint8Array;
  }): Promise<StoredFile>;
  /** Fetch an object's bytes + content-type, or null if it doesn't exist. */
  get(key: string): Promise<StoredObject | null>;
  /** Remove an object. No-op if it's already gone. */
  del(key: string): Promise<void>;
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
    const absPath = this.resolve(relPath);
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

  // Resolve a key inside the uploads root, rejecting path traversal.
  private resolve(key: string): string {
    const abs = path.resolve(this.root, key);
    if (abs !== this.root && !abs.startsWith(this.root + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return abs;
  }

  async get(key: string): Promise<StoredObject | null> {
    try {
      const body = await fs.readFile(this.resolve(key));
      return { body, contentType: contentTypeForKey(key) };
    } catch {
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch {
      /* already gone / invalid — nothing to do */
    }
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
    await store.set(key, body as unknown as ArrayBuffer, { metadata: { contentType } });
    return {
      key,
      url: `/api/files/${key}`,
      contentType,
      size: body.byteLength,
    };
  }

  private async openStore() {
    const { getStore } = await import("@netlify/blobs");
    return getStore({ name: this.store, consistency: "strong" });
  }

  async get(key: string): Promise<StoredObject | null> {
    const store = await this.openStore();
    const stream = await store.get(key, { type: "stream" });
    if (!stream) return null;
    const meta = await store.getMetadata(key);
    return {
      body: stream as ReadableStream<Uint8Array>,
      contentType:
        (meta?.metadata?.contentType as string | undefined) ?? contentTypeForKey(key),
    };
  }

  async del(key: string): Promise<void> {
    const store = await this.openStore();
    await store.delete(key);
  }
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

/** Best-effort MIME from a key's extension (fallback when no metadata). */
export function contentTypeForKey(key: string): string {
  const ext = path.extname(key).toLowerCase();
  switch (ext) {
    case ".pdf": return "application/pdf";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".gif": return "image/gif";
    case ".heic": return "image/heic";
    case ".svg": return "image/svg+xml";
    default: return "application/octet-stream";
  }
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
