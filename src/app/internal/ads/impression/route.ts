import { NextRequest, NextResponse } from "next/server";
import { adEngineFetch, adsConfigured, AD_ENGINE_PLATFORM } from "@/lib/ad-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /internal/ads/impression — fire-and-forget; always 204 so the
// client (sendBeacon) never blocks or surfaces an error to the page.
export async function POST(req: NextRequest) {
  if (!adsConfigured()) return new NextResponse(null, { status: 204 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    await adEngineFetch("/api/ads/impression", {
      method: "POST",
      // platform is injected server-side, never trusted from the client
      body: JSON.stringify({ ...body, platform: AD_ENGINE_PLATFORM }),
    });
  } catch {
    // swallow — impressions are best-effort
  }
  return new NextResponse(null, { status: 204 });
}
