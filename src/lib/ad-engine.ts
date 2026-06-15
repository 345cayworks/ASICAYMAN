/**
 * Cayworks Ad Engine — server-side client.
 *
 * The API key is a SECRET. It is read here from process.env.AD_ENGINE_KEY and
 * is ONLY ever used in this module (imported by the /internal/ads/* proxy
 * routes). It is never sent to the client, committed, or placed in a URL.
 */

export const AD_ENGINE_BASE_URL =
  process.env.AD_ENGINE_BASE_URL ?? "https://ads.cayworks.com";

export const AD_ENGINE_PLATFORM =
  process.env.AD_ENGINE_PLATFORM ?? "asicayman";

const AD_ENGINE_KEY = process.env.AD_ENGINE_KEY;

export function adsConfigured(): boolean {
  return Boolean(AD_ENGINE_KEY && AD_ENGINE_KEY.length > 0);
}

/**
 * Forward a request to the ad engine with the secret key attached.
 * Returns the raw Response, or null when ads are not configured / the
 * engine is unreachable — callers degrade gracefully (no ad, page intact).
 */
export async function adEngineFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response | null> {
  if (!AD_ENGINE_KEY) return null;
  try {
    return await fetch(`${AD_ENGINE_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        "X-Ad-Engine-Key": AD_ENGINE_KEY,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------------
 * Host-push placement sync (Option B)
 *
 * Push this platform's full placement manifest to the engine so its
 * AdPlacement rows stay in lockstep with the slots this app actually exposes.
 * Run intentionally (e.g. `npm run ads:sync`) — it is NOT wired into the build.
 * The key stays server-side: this uses adEngineFetch, so only call it from
 * server code / scripts, never the browser.
 * ------------------------------------------------------------------------- */

export type PlacementType =
  | "BANNER"
  | "SIDEBAR"
  | "CARD"
  | "NATIVE"
  | "VIDEO"
  | "SKYSCRAPER";

export type PlacementManifestEntry = {
  key: string;
  name: string;
  type: PlacementType;
  description?: string;
  allowedSizes?: string[];
};

export type SyncResult = {
  ok: boolean;
  platform?: string;
  synced?: string;
  pruned?: boolean;
  created: string[];
  updated: string[];
  stale: string[];
  error?: string;
};

/**
 * Reconcile the engine's AdPlacement rows with `placements`. Returns which
 * keys the engine created/updated, plus any it has that aren't in the
 * manifest (`stale`). Pass { prune: true } to deactivate the stale set;
 * otherwise stale is informational only. Defaults to a non-destructive sync.
 */
export async function syncPlacements(
  placements: PlacementManifestEntry[],
  opts: { prune?: boolean } = {},
): Promise<SyncResult> {
  const path = `/api/platforms/sync-placements${opts.prune ? "?prune=1" : ""}`;
  const res = await adEngineFetch(path, {
    method: "POST",
    body: JSON.stringify({ platform: AD_ENGINE_PLATFORM, placements }),
  });
  if (!res) {
    return { ok: false, created: [], updated: [], stale: [], error: "Ads not configured or engine unreachable" };
  }
  const body = (await res.json().catch(() => ({}))) as Partial<SyncResult>;
  if (!res.ok) {
    return {
      ok: false,
      created: [],
      updated: [],
      stale: [],
      error: body.error ?? `HTTP ${res.status}`,
    };
  }
  return {
    ok: true,
    platform: body.platform,
    synced: body.synced,
    pruned: body.pruned,
    created: body.created ?? [],
    updated: body.updated ?? [],
    stale: body.stale ?? [],
  };
}
