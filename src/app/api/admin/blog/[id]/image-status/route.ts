import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

/** Poll the two-image job status (admin). */
export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { imageJobStatus: true, imageJobStage: true, imageJobError: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    status: post.imageJobStatus,
    stage: post.imageJobStage,
    error: post.imageJobError,
  });
}
