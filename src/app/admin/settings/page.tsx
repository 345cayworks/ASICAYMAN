import { requireSuperadmin } from "@/lib/rbac";
import { getTrackingSettings } from "@/lib/tracking";
import { updateTrackingSettings } from "./actions";

export const dynamic = "force-dynamic";

type Search = Promise<{ ok?: string; error?: string }>;

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  await requireSuperadmin();
  const tracking = await getTrackingSettings();
  const { ok, error } = await searchParams;

  const lastUpdated =
    tracking.enabledUpdatedAt ||
    tracking.gaUpdatedAt ||
    tracking.fbUpdatedAt ||
    null;

  return (
    <div className="grid gap-6">
      <header>
        <p className="section-eyebrow">Settings · SuperAdmin</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl tracking-tight text-white">
          Tracking
        </h1>
        <p className="mt-2 text-[color:var(--color-navy-300)] text-sm">
          Google Analytics and Facebook Pixel for the whole platform.
        </p>
      </header>

      {ok && (
        <div className="card bg-white text-[color:var(--color-navy-900)] p-4 border-l-4 border-[color:var(--color-teal-600)]">
          Tracking settings saved. The change is live across the site.
        </div>
      )}
      {error && (
        <div className="card bg-white text-[color:var(--color-navy-900)] p-4 border-l-4 border-red-500">
          {error}
        </div>
      )}

      <section className="card bg-white text-[color:var(--color-navy-900)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl">Tracking</h2>
            <p className="mt-1 text-sm text-[color:var(--color-navy-600)] max-w-prose">
              We only accept Google Analytics and Facebook Pixel IDs (not
              freeform snippets). The platform server-renders the official
              Google and Facebook templates around those IDs to keep the
              surface secure.
            </p>
          </div>
          <span
            className={`badge shrink-0 ${tracking.enabled ? "badge-approved" : "badge-paid"}`}
          >
            {tracking.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        <form action={updateTrackingSettings} className="mt-5 grid gap-5">
          <label className="flex items-center gap-3 select-none">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={tracking.enabled}
              className="size-4 rounded border-[color:var(--color-navy-300)]"
            />
            <span className="text-sm font-medium">Tracking enabled</span>
          </label>

          <div className="grid sm:grid-cols-2 gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[color:var(--color-navy-600)]">
                Google Analytics Measurement ID
              </span>
              <input
                type="text"
                name="gaId"
                defaultValue={tracking.gaId ?? ""}
                placeholder="G-XXXXXXXX"
                pattern="^G-[A-Z0-9]+$"
                title="Format: G- followed by uppercase letters/digits"
                autoComplete="off"
                className="rounded-md border border-[color:var(--color-navy-200)] bg-white px-3 py-2 text-sm font-mono"
              />
              <span className="text-xs text-[color:var(--color-navy-500)]">
                Leave blank to disable GA. Letters auto-uppercased on save.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[color:var(--color-navy-600)]">
                Facebook Pixel ID
              </span>
              <input
                type="text"
                name="fbPixelId"
                defaultValue={tracking.fbPixelId ?? ""}
                placeholder="123456789012345"
                pattern="^\d{6,20}$"
                title="6 to 20 digits"
                autoComplete="off"
                inputMode="numeric"
                className="rounded-md border border-[color:var(--color-navy-200)] bg-white px-3 py-2 text-sm font-mono"
              />
              <span className="text-xs text-[color:var(--color-navy-500)]">
                Leave blank to disable Facebook Pixel.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[color:var(--color-navy-500)]">
              {lastUpdated ? (
                <>
                  Last updated{" "}
                  <time dateTime={lastUpdated.toISOString()}>
                    {lastUpdated.toLocaleString()}
                  </time>
                  {tracking.updatedByEmail
                    ? ` by ${tracking.updatedByEmail}`
                    : ""}
                </>
              ) : (
                "Never updated."
              )}
            </p>
            <button type="submit" className="btn btn-primary">
              Save tracking settings
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
