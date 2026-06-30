import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { R2Bucket } from "@cloudflare/workers-types";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveDriver } from "@/lib/storage";

/**
 * Serves uploaded files (currently receipts) with access control.
 * - Admins/superadmins: can view any file.
 * - Authenticated users: can view files they own (uploaded themselves).
 * - Anyone else: 403.
 *
 * Driver fan-out:
 * - Local: reads from ./.uploads
 * - Netlify Blobs: pulls from the asi-cayman store
 * - Cloudflare R2: pulls from the BUCKET binding
 */

export const runtime = "nodejs"; // we need fs + @netlify/blobs

type Params = { path: string[] };

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Normalise key and reject path traversal
  const key = segments.join("/");
  if (key.includes("..") || key.includes("\\")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Authn
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Sign in to view this file", { status: 401 });
  }

  // Authz — admin or owner
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";
  const ownedUrl = `/api/files/${key}`;

  if (!isAdmin) {
    // Check the file is referenced by something the user owns
    const owned = await prisma.paymentReceipt.findFirst({
      where: {
        receiptFileUrl: ownedUrl,
        userId: session.user.id,
      },
      select: { id: true },
    });
    if (!owned) {
      // Also allow owner of an expo registration that references it.
      // Match by account id, plus email only when we actually have one.
      const ownerOr: { userId?: string; email?: string }[] = [];
      if (session.user.id) ownerOr.push({ userId: session.user.id });
      if (session.user.email) ownerOr.push({ email: session.user.email });
      const reg = ownerOr.length
        ? await prisma.expoRegistration.findFirst({
            where: { receiptUrl: ownedUrl, OR: ownerOr },
            select: { id: true },
          })
        : null;
      if (!reg) return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const driver = resolveDriver();

  if (driver === "netlify-blobs") {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "asi-cayman", consistency: "strong" });
    const meta = await store.getMetadata(key);
    const stream = await store.get(key, { type: "stream" });
    if (!stream) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(stream as ReadableStream, {
      headers: {
        "Content-Type": (meta?.metadata?.contentType as string) ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  }

  if (driver === "r2") {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as unknown as Record<string, R2Bucket>;
    const bucket = env.BUCKET;
    if (!bucket) return new NextResponse("Storage not configured", { status: 500 });
    const obj = await bucket.get(key);
    if (!obj) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(obj.body as unknown as ReadableStream, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  }

  // Local driver — read from ./.uploads.
  // Defence-in-depth: resolve and confirm the path stays inside the uploads root.
  const uploadsRoot = path.join(process.cwd(), ".uploads");
  const abs = path.resolve(uploadsRoot, key);
  if (abs !== uploadsRoot && !abs.startsWith(uploadsRoot + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const file = await fs.readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    const mime =
      ext === ".pdf" ? "application/pdf" :
      ext === ".png" ? "image/png" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      ext === ".webp" ? "image/webp" :
      ext === ".heic" ? "image/heic" :
      "application/octet-stream";
    return new NextResponse(file, {
      headers: {
        "Content-Type": mime,
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
