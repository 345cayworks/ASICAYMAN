import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/blog/cron-auth";
import { runPublishSweep } from "@/lib/blog/generate-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Invoked by the Netlify scheduled function. Publishes any post whose
// scheduledFor has passed. Secret-gated.
async function handle(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await runPublishSweep();
  return NextResponse.json(result);
}

export const POST = handle;
export const GET = handle;
