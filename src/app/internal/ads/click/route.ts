import { NextRequest, NextResponse } from "next/server";
import { adEngineFetch, adsConfigured, AD_ENGINE_PLATFORM } from "@/lib/ad-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /internal/ads/click — forwards the click and returns the engine's
// sanitized { destinationUrl } for the client to open. Returns null on any
// failure so the client simply does nothing.
export async function POST(req: NextRequest) {
  if (!adsConfigured()) return NextResponse.json({ destinationUrl: null });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const res = await adEngineFetch("/api/ads/click", {
      method: "POST",
      body: JSON.stringify({ ...body, platform: AD_ENGINE_PLATFORM }),
    });
    if (!res || !res.ok) return NextResponse.json({ destinationUrl: null });
    const data = (await res.json()) as { destinationUrl?: string };
    return NextResponse.json({ destinationUrl: data.destinationUrl ?? null });
  } catch {
    return NextResponse.json({ destinationUrl: null });
  }
}
