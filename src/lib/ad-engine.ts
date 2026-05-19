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
