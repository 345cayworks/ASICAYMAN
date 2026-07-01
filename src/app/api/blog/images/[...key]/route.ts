import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";

/**
 * Public blog image server: GET /api/blog/images/<key>
 *
 * Streams a blob's bytes + content-type with a long immutable cache. Unlike
 * /api/files/[...path] this is intentionally PUBLIC (blog covers are used as
 * OG/social images and shown to anonymous readers), so it is deliberately
 * scoped to the `blog/` key prefix — it can never read receipts or other
 * private uploads that live under different folders.
 */

export const runtime = "nodejs"; // needs fs + @netlify/blobs

type Params = { key: string[] };

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { key: segments } = await params;
  if (!segments || segments.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = segments.join("/");
  // Reject traversal and confine to blog assets only.
  if (key.includes("..") || key.includes("\\") || !key.startsWith("blog/")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const object = await getStorage().get(key);
  if (!object) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(object.body as BodyInit, {
    headers: {
      "Content-Type": object.contentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
