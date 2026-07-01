import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { imageApiConfigured } from "@/lib/blog/images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

/**
 * START the two-image job (superadmin). Sets the job PENDING and fires the
 * Netlify background worker, returning immediately — the render itself runs in
 * the background function, never in this request.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth();
  if (session?.user?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!imageApiConfigured()) {
    return NextResponse.json({ error: "Image generation is not configured" }, { status: 400 });
  }

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, imageJobStatus: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.imageJobStatus === "PENDING" || post.imageJobStatus === "RUNNING") {
    return NextResponse.json({ status: post.imageJobStatus }); // already in flight
  }

  await prisma.blogPost.update({
    where: { id },
    data: {
      imageJobStatus: "PENDING",
      imageJobStage: "queued",
      imageJobError: null,
      imageJobUpdatedAt: new Date(),
    },
  });

  const base =
    process.env.URL || process.env.DEPLOY_PRIME_URL || new URL(req.url).origin;
  const workerUrl = `${base}/.netlify/functions/blog-image-worker-background`;
  try {
    // Background function returns 202 immediately; this await is quick.
    await fetch(workerUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postId: id }),
    });
  } catch {
    await prisma.blogPost.update({
      where: { id },
      data: {
        imageJobStatus: "ERROR",
        imageJobStage: "error",
        imageJobError: "Could not start the background worker",
        imageJobUpdatedAt: new Date(),
      },
    });
    return NextResponse.json({ error: "Could not start worker" }, { status: 500 });
  }

  return NextResponse.json({ status: "PENDING" });
}
