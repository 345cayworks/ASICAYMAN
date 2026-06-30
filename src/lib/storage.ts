/**
 * Storage adapter — abstraction over local filesystem (dev), Netlify Blobs
 * (Netlify prod), and Cloudflare R2 (Cloudflare Workers prod). Swap drivers
 * via the `STORAGE_DRIVER` env var; auto-detection handles the platform
 * defaults so dev rarely needs to set it.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { R2Bucket } from "@cloudflare/workers-types";

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
    await store.set(key, body as unknown as ArrayBuffer, { metadata: { contentType } });
    return {
      key,
      url: `/api/files/${key}`,
      contentType,
      size: body.byteLength,
    };
  }
}

class R2Driver implements StorageDriver {
  // The R2 bucket binding name in wrangler.jsonc. Stays as "BUCKET" by
  // convention; override at construction if a deployment uses a different
  // binding name.
  private binding: string;
  constructor(binding = "BUCKET") {
    this.binding = binding;
  }
  async put({ folder, filename, contentType, body }: Parameters<StorageDriver["put"]>[0]) {
    // Lazy-import so this module still resolves outside the Workers runtime
    // (local dev, Netlify builds) where `@opennextjs/cloudflare` isn't loaded.
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as unknown as Record<string, R2Bucket>;
    const bucket = env[this.binding];
    if (!bucket) {
      throw new Error(
        `R2 bucket binding "${this.binding}" not found on the Worker. ` +
          "Check wrangler.jsonc r2_buckets configuration.",
      );
    }
    const safeName = sanitize(filename);
    const id = crypto.randomBytes(8).toString("hex");
    const key = path.posix.join(folder, `${id}-${safeName}`);
    await bucket.put(key, body as ArrayBuffer | Uint8Array, {
      httpMetadata: { contentType },
    });
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
  const driver = resolveDriver();
  if (driver === "netlify-blobs") return new NetlifyBlobsDriver();
  if (driver === "r2") return new R2Driver();
  return new LocalDriver();
}

// Exposed so the /api/files/[...path] route resolves to the same driver
// `getStorage` would have used. Read-only: callers should not pass this
// value back around the system.
export function resolveDriver(): "local" | "netlify-blobs" | "r2" {
  const explicit = process.env.STORAGE_DRIVER;
  if (explicit === "local" || explicit === "netlify-blobs" || explicit === "r2") {
    return explicit;
  }
  if (process.env.NETLIFY) return "netlify-blobs";
  // No reliable env signal for Workers — default to local unless explicitly
  // set via wrangler.jsonc vars (STORAGE_DRIVER=r2).
  return "local";
}

export const ALLOWED_RECEIPT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
  "application/pdf",
]);
export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024; // 8 MB
