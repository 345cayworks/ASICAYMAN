import { NextRequest, NextResponse } from "next/server";
import {
  adEngineFetch,
  adsConfigured,
  AD_ENGINE_PLATFORM,
  AD_ENGINE_BASE_URL,
} from "@/lib/ad-engine";

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
    if (sp.get("debug") === "1") {
      return NextResponse.json({
        debug: true,
        configured: false,
        note: "AD_ENGINE_KEY is not present at runtime — ads disabled",
      });
    }
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

  // Temporary, non-sensitive diagnostic. Never echoes the API key (the key
  // is sent as a header, not in the URL/body). Remove once ads are verified.
  const debug = sp.get("debug") === "1";

  const res = await adEngineFetch(`/api/ads/serve?${q.toString()}`);

  if (debug) {
    let host = "(unparseable)";
    try {
      host = new URL(AD_ENGINE_BASE_URL).host;
    } catch {}
    if (!res) {
      return NextResponse.json({
        debug: true,
        configured: true,
        engineHost: host,
        platform: AD_ENGINE_PLATFORM,
        placement,
        reachable: false,
        note: "fetch to engine threw or ads not configured",
      });
    }
    const bodyText = await res.text();
    return NextResponse.json({
      debug: true,
      configured: true,
      engineHost: host,
      platform: AD_ENGINE_PLATFORM,
      placement,
      requestPath: `/api/ads/serve?${q.toString()}`,
      upstreamStatus: res.status,
      upstreamOk: res.ok,
      upstreamBodySnippet: bodyText.slice(0, 500),
    });
  }

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
