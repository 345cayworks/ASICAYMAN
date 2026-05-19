import { requireAdmin } from "@/lib/rbac";
import {
  adEngineFetch,
  adsConfigured,
  AD_ENGINE_BASE_URL,
  AD_ENGINE_PLATFORM,
} from "@/lib/ad-engine";
import { AdBanner } from "@/components/ads/variants";
import { AD_PLACEMENTS } from "@/components/ads/placements";

export const dynamic = "force-dynamic";

type Search = Promise<{ placement?: string; role?: string }>;

const PLACEMENT_OPTIONS = [
  AD_PLACEMENTS.dashboardTop,
  AD_PLACEMENTS.sidebar,
  AD_PLACEMENTS.directoryInline,
  AD_PLACEMENTS.expoBanner,
] as const;

interface ServeResult {
  status: number | null;
  ok: boolean;
  adPresent: boolean;
  adTitle: string | null;
  creativeType: string | null;
  bodySnippet: string;
}

interface DiagnoseResult {
  status: number | null;
  ok: boolean;
  bodySnippet: string;
  unsupported: boolean;
}

async function probeServe(
  placement: string,
  userRole: string,
): Promise<ServeResult | null> {
  const q = new URLSearchParams({
    platform: AD_ENGINE_PLATFORM,
    placement,
    userRole,
  });
  const res = await adEngineFetch(`/api/ads/serve?${q.toString()}`);
  if (!res) return null;
  const text = await res.text();
  let adPresent = false;
  let adTitle: string | null = null;
  let creativeType: string | null = null;
  try {
    const data = JSON.parse(text) as {
      ad?: { title?: string; creativeType?: string } | null;
    };
    if (data?.ad) {
      adPresent = true;
      adTitle = data.ad.title ?? null;
      creativeType = data.ad.creativeType ?? null;
    }
  } catch {}
  return {
    status: res.status,
    ok: res.ok,
    adPresent,
    adTitle,
    creativeType,
    bodySnippet: text.slice(0, 400),
  };
}

async function probeDiagnose(
  placement: string,
): Promise<DiagnoseResult | null> {
  const q = new URLSearchParams({
    platform: AD_ENGINE_PLATFORM,
    placement,
  });
  const res = await adEngineFetch(`/api/ads/diagnose?${q.toString()}`);
  if (!res) return null;
  const text = await res.text();
  return {
    status: res.status,
    ok: res.ok,
    bodySnippet: text.slice(0, 600),
    unsupported: res.status === 404,
  };
}

export default async function AdsTestPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  await requireAdmin();
  const { placement: pParam, role: rParam } = await searchParams;
  const placement: string = (PLACEMENT_OPTIONS as readonly string[]).includes(
    pParam ?? "",
  )
    ? (pParam as string)
    : AD_PLACEMENTS.dashboardTop;
  const userRole = rParam?.trim() ? rParam.trim() : "MEMBER";

  const configured = adsConfigured();
  let engineHost = "(unparseable)";
  try {
    engineHost = new URL(AD_ENGINE_BASE_URL).host;
  } catch {}

  const [serve, diagnose] = configured
    ? await Promise.all([probeServe(placement, userRole), probeDiagnose(placement)])
    : [null, null];

  return (
    <div className="grid gap-6">
      <header>
        <p className="section-eyebrow">Admin</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl tracking-tight text-white">
          Ad engine test
        </h1>
        <p className="mt-2 text-[color:var(--color-navy-300)] text-sm">
          Verifies this app can reach the Cayworks Ad Engine and that an ad
          would serve for the selected placement. All checks run server-side
          through <code>/internal/ads/*</code> — the API key never leaves the
          server.
        </p>
      </header>

      <form
        method="get"
        className="card bg-white text-[color:var(--color-navy-900)] p-5 flex flex-wrap items-end gap-4"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[color:var(--color-navy-600)]">
            Placement
          </span>
          <select
            name="placement"
            defaultValue={placement}
            className="rounded-md border border-[color:var(--color-navy-200)] bg-white px-3 py-2 text-sm min-w-[240px]"
          >
            {PLACEMENT_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[color:var(--color-navy-600)]">
            userRole
          </span>
          <input
            name="role"
            defaultValue={userRole}
            placeholder="MEMBER"
            className="rounded-md border border-[color:var(--color-navy-200)] bg-white px-3 py-2 text-sm w-[160px]"
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Re-run checks
        </button>
      </form>

      <section className="card bg-white text-[color:var(--color-navy-900)] p-6">
        <h2 className="font-display text-xl">Checks</h2>
        <ul className="mt-4 grid gap-3">
          <CheckRow
            ok={configured}
            label="Server env config"
            detail={
              configured
                ? `AD_ENGINE_KEY present · engineHost=${engineHost} · platform=${AD_ENGINE_PLATFORM}`
                : "AD_ENGINE_KEY is NOT set — every slot will render nothing"
            }
          />
          <CheckRow
            ok={!!serve?.ok}
            warn={!!serve?.ok && !serve?.adPresent}
            label="GET /api/ads/serve"
            detail={
              !configured
                ? "skipped (engine not configured)"
                : !serve
                  ? "fetch failed (network or DNS)"
                  : !serve.ok
                    ? `HTTP ${serve.status} — body: ${serve.bodySnippet}`
                    : serve.adPresent
                      ? `HTTP 200 · ad="${serve.adTitle ?? "(untitled)"}" · type=${serve.creativeType ?? "?"}`
                      : "HTTP 200 · no ad returned (no campaign targets this placement yet)"
            }
          />
          <CheckRow
            ok={!!diagnose?.ok}
            warn={!!diagnose?.unsupported}
            label="GET /api/ads/diagnose"
            detail={
              !configured
                ? "skipped"
                : !diagnose
                  ? "fetch failed"
                  : diagnose.unsupported
                    ? "HTTP 404 — diagnose endpoint not exposed by this engine version"
                    : `HTTP ${diagnose.status} · body: ${diagnose.bodySnippet}`
            }
          />
          <CheckRow
            ok={!!serve?.adPresent}
            warn={!serve?.adPresent}
            label="Live <AdBanner> mount"
            detail={
              serve?.adPresent
                ? "ad should render below; impression fires once it is ≥50% visible"
                : "renders nothing while engine returns no ad (graceful empty by design)"
            }
          />
        </ul>
      </section>

      <section className="card bg-white text-[color:var(--color-navy-900)] p-6">
        <h2 className="font-display text-xl">Live render</h2>
        <p className="mt-1 text-sm text-[color:var(--color-navy-600)]">
          Below: an actual <code>&lt;AdBanner&gt;</code> for{" "}
          <code>{placement}</code> with <code>userRole={userRole}</code>.
        </p>
        <div className="mt-4 border-2 border-dashed border-[color:var(--color-navy-200)] rounded-lg p-4">
          <AdBanner placement={placement} userRole={userRole} />
          <p className="text-xs text-[color:var(--color-navy-500)] mt-3">
            If this area is blank, the engine returned no ad for that
            placement/role. The slot collapses to nothing — that's intentional.
          </p>
        </div>
      </section>
    </div>
  );
}

function CheckRow({
  ok,
  warn,
  label,
  detail,
}: {
  ok: boolean;
  warn?: boolean;
  label: string;
  detail: string;
}) {
  const cls = ok ? "badge-approved" : warn ? "badge-pending" : "badge-rejected";
  const word = ok ? "OK" : warn ? "WARN" : "FAIL";
  return (
    <li className="flex items-start gap-3">
      <span className={`badge ${cls} shrink-0 mt-0.5`}>{word}</span>
      <div className="min-w-0">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-[color:var(--color-navy-600)] break-words mt-0.5">
          {detail}
        </p>
      </div>
    </li>
  );
}
