import { NextRequest, NextResponse } from "next/server";
import { adEngineFetch, adsConfigured, AD_ENGINE_PLATFORM } from "@/lib/ad-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /internal/ads/serve?placement=&userRole=&category=&pageUrl=
// Proxies to {BASE}/api/ads/serve with the secret key injected server-side.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const placement = sp.get("placement");
  if (!placement) {
    return NextResponse.json({ ad: null }, { status: 400 });
  }
  if (!adsConfigured()) {
    return NextResponse.json({ ad: null });
  }

  const q = new URLSearchParams({
    platform: AD_ENGINE_PLATFORM,
    placement,
    userRole: sp.get("userRole") ?? "GUEST",
  });
  const category = sp.get("category");
  const pageUrl = sp.get("pageUrl");
  if (category) q.set("category", category);
  if (pageUrl) q.set("pageUrl", pageUrl);

  const res = await adEngineFetch(`/api/ads/serve?${q.toString()}`);
  if (!res || !res.ok) {
    return NextResponse.json({ ad: null });
  }
  try {
    const data = (await res.json()) as { ad?: unknown };
    return NextResponse.json({ ad: data.ad ?? null });
  } catch {
    return NextResponse.json({ ad: null });
  }
}
