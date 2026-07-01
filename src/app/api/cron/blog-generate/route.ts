import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/blog/cron-auth";
import { runGenerate } from "@/lib/blog/generate-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Invoked by the Netlify scheduled function (daily). Generates one AI DRAFT,
// honouring the 18h idempotency guard. Secret-gated.
async function handle(req: NextRequest) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await runGenerate();
  const status = result.status === "error" ? 500 : 200;
  return NextResponse.json(result, { status });
}

export const POST = handle;
export const GET = handle;
