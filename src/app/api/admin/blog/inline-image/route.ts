import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * POST /api/admin/blog/inline-image  (admin only)
 * Accepts a multipart image, stores it under blog/inline, and returns a
 * ready-to-paste Markdown snippet pointing at the public image route.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image larger than 8 MB" }, { status: 413 });
  }

  const alt = String(form?.get("alt") ?? "").trim() || "image";
  const stored = await getStorage().put({
    folder: "blog/inline",
    filename: file.name || "image.png",
    contentType: file.type,
    body: Buffer.from(await file.arrayBuffer()),
  });
  const url = `/api/blog/images/${stored.key}`;
  return NextResponse.json({ url, markdown: `![${alt}](${url})` });
}
