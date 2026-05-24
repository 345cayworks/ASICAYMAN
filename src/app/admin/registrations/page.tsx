import Link from "next/link";
import { CheckCircle2, X, FileText, Video, DollarSign, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDollars } from "@/lib/pricing";
import { markPaid, rejectPayment, saveRegistrationNote } from "@/app/admin/actions";
import { DonutChart, type DonutDatum } from "@/components/charts/donut-chart";
import { VerticalBarChart, type VBarDatum } from "@/components/charts/bar-chart";
import {
  CHART_COLORS,
  colorForStatus,
  prettifyStatus,
} from "@/components/charts/colors";

export const dynamic = "force-dynamic";
export const metadata = { title: "Expo registrations" };

const DAY_MS = 86_400_000;
const TREND_DAYS = 14;

function dailyCounts(items: { createdAt: Date }[], days: number): VBarDatum[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = today.getTime() - (days - 1) * DAY_MS;
  const buckets = new Array(days).fill(0);
  const labels: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() - (days - 1 - i) * DAY_MS);
    labels.push(
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    );
  }
  for (const it of items) {
    const t = new Date(it.createdAt);
    t.setUTCHours(0, 0, 0, 0);
    const idx = Math.floor((t.getTime() - start) / DAY_MS);
    if (idx >= 0 && idx < days) buckets[idx]++;
  }
  return buckets.map((value, i) => ({ label: labels[i], value }));
}

interface Props {
  searchParams: Promise<{
    status?: string;
    asi?: string;
    earlyBird?: string;
    booth?: string;
    interview?: string;
    video?: string;
  }>;
}

export default async function AdminRegistrationsPage({ searchParams }: Props) {
  const params = await searchParams;

  const where = {
    ...(params.status ? { paymentStatus: params.status as "PENDING" | "RECEIPT_UPLOADED" | "PAID" | "VERIFIED" | "REJECTED" | "REFUNDED" } : {}),
    ...(params.asi === "1" ? { isAsiMember: true } : {}),
    ...(params.earlyBird === "1" ? { earlyBirdApplied: true } : {}),
    ...(params.booth === "1" ? { needsBooth: true } : {}),
    ...(params.interview === "1" ? { wantsInterview: true } : {}),
    ...(params.video === "1" ? { wantsVideoSubmission: true } : {}),
  };

  const registrations = await prisma.expoRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Summary derived in JS from the filtered set so filter changes update
  // the charts in lockstep with the table.
  const matchingRevenue = registrations
    .filter((r) => r.paymentStatus === "PAID")
    .reduce((s, r) => s + r.paymentAmount, 0);

  const matchingStatusCounts = registrations.reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.paymentStatus] = (acc[r.paymentStatus] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const matchingDonut: DonutDatum[] = Object.entries(matchingStatusCounts)
    .map(([status, value]) => ({
      label: prettifyStatus(status),
      value,
      color: colorForStatus(status),
    }))
    .sort((a, b) => b.value - a.value);

  const trendData = dailyCounts(registrations, TREND_DAYS);
  const trendTotal = trendData.reduce((s, d) => s + d.value, 0);

  const hasActiveFilter = Object.keys(params).length > 0;

  return (
    <div className="grid gap-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="section-eyebrow">Admin</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Expo registrations</h1>
          <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
            {registrations.length} {registrations.length === 1 ? "registration" : "registrations"} matching filters.
          </p>
        </div>
      </header>

      {/* Summary — recomputes from the current filter so charts track the table */}
      <section className="grid lg:grid-cols-[1fr_1fr_auto] gap-5">
        <div className="card p-5">
          <p className="section-eyebrow flex items-center gap-1.5">
            <DollarSign size={12} /> Revenue (matching)
          </p>
          <p className="mt-3 font-display text-3xl text-[color:var(--color-navy-900)] tabular-nums">
            {formatDollars(matchingRevenue)}
          </p>
          <p className="mt-1 text-xs text-[color:var(--color-navy-600)]">
            Verified payments in current filter
          </p>
        </div>
        <div className="card p-5">
          <p className="section-eyebrow flex items-center gap-1.5">
            <TrendingUp size={12} /> Last {TREND_DAYS} days
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-3xl text-[color:var(--color-navy-900)] tabular-nums">
              {trendTotal}
            </span>
            <span className="text-xs text-[color:var(--color-navy-600)]">
              new registration{trendTotal === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4">
            <VerticalBarChart
              data={trendData}
              height={68}
              color={CHART_COLORS.neutralDeep}
              ariaLabel={`Daily new registrations over the last ${TREND_DAYS} days`}
            />
          </div>
        </div>
        <div className="card p-5 min-w-0">
          <p className="section-eyebrow">Status breakdown</p>
          <div className="mt-3">
            <DonutChart
              data={matchingDonut}
              size={120}
              strokeWidth={14}
              ariaLabel={
                hasActiveFilter
                  ? "Matching registrations by payment status"
                  : "All registrations by payment status"
              }
              centerLabel={{
                value: registrations.length,
                sub: hasActiveFilter ? "matching" : "total",
              }}
              emptyLabel="No registrations match"
            />
          </div>
        </div>
      </section>

      <Filters params={params} />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-[color:var(--color-navy-600)] border-b border-[color:var(--color-navy-100)]">
            <tr>
              <th className="text-left px-5 py-3">Business / Person</th>
              <th className="text-left px-3 py-3">Contact</th>
              <th className="text-left px-3 py-3">Status</th>
              <th className="text-left px-3 py-3">Amount</th>
              <th className="text-left px-3 py-3">Flags</th>
              <th className="text-left px-3 py-3">Receipt</th>
              <th className="text-left px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-navy-100)]">
            {registrations.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-[color:var(--color-navy-600)]">No registrations match.</td></tr>
            ) : (
              registrations.map((r) => (
                <tr key={r.id} className="align-top hover:bg-[color:var(--color-cream)]/40 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-[color:var(--color-navy-900)]">{r.businessName}</p>
                    <p className="text-xs text-[color:var(--color-navy-600)]">{r.fullName}</p>
                    <p className="text-xs text-[color:var(--color-navy-600)]">{r.businessCategory}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-xs">{r.email}</p>
                    <p className="text-xs text-[color:var(--color-navy-600)]">{r.phone}</p>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`badge ${badgeForStatus(r.paymentStatus)}`}>{r.paymentStatus.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-3 py-4 font-medium">{formatDollars(r.paymentAmount)}</td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-1">
                      {r.isAsiMember && <span className="badge badge-approved">ASI</span>}
                      {r.earlyBirdApplied && <span className="badge badge-pending">Early-bird</span>}
                      {r.needsBooth && <span className="badge badge-paid">Booth</span>}
                      {r.wantsInterview && <span className="badge badge-pending"><FileText size={10} /> Interview</span>}
                      {r.wantsVideoSubmission && <span className="badge badge-pending"><Video size={10} /> Video</span>}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    {r.receiptUrl ? (
                      <a href={r.receiptUrl} target="_blank" rel="noreferrer" className="text-xs underline">View</a>
                    ) : <span className="text-xs text-[color:var(--color-navy-500)]">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2 min-w-[180px]">
                      {r.paymentStatus !== "PAID" && (
                        <form action={markPaid}>
                          <input type="hidden" name="registrationId" value={r.id} />
                          <button className="btn btn-primary text-xs py-1.5 px-3 w-full">
                            <CheckCircle2 size={12} /> Mark paid
                          </button>
                        </form>
                      )}
                      {r.paymentStatus !== "REJECTED" && (
                        <form action={rejectPayment}>
                          <input type="hidden" name="registrationId" value={r.id} />
                          <input
                            type="text"
                            name="note"
                            placeholder="Rejection reason (optional)"
                            className="field-input text-xs py-1.5"
                          />
                          <button className="btn btn-outline text-xs py-1.5 px-3 mt-1 w-full">
                            <X size={12} /> Reject
                          </button>
                        </form>
                      )}
                      <form action={saveRegistrationNote}>
                        <input type="hidden" name="registrationId" value={r.id} />
                        <textarea
                          name="note"
                          defaultValue={r.adminNotes ?? ""}
                          placeholder="Admin notes…"
                          rows={2}
                          className="field-input text-xs py-1.5 min-h-[40px]"
                        />
                        <button className="text-xs underline text-[color:var(--color-navy-700)] mt-1">Save note</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Filters({ params }: { params: { status?: string; asi?: string; earlyBird?: string; booth?: string; interview?: string; video?: string } }) {
  function chipHref(key: string, value: string) {
    const sp = new URLSearchParams(params as Record<string, string>);
    if (sp.get(key) === value) sp.delete(key);
    else sp.set(key, value);
    return `/admin/registrations?${sp.toString()}`;
  }

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <FilterChip active={!params.status} href="/admin/registrations">All statuses</FilterChip>
      <FilterChip active={params.status === "PENDING"} href={chipHref("status", "PENDING")}>Pending</FilterChip>
      <FilterChip active={params.status === "RECEIPT_UPLOADED"} href={chipHref("status", "RECEIPT_UPLOADED")}>Receipt uploaded</FilterChip>
      <FilterChip active={params.status === "PAID"} href={chipHref("status", "PAID")}>Paid</FilterChip>
      <FilterChip active={params.status === "REJECTED"} href={chipHref("status", "REJECTED")}>Rejected</FilterChip>
      <span className="w-px self-stretch bg-[color:var(--color-navy-100)] mx-1" />
      <FilterChip active={params.asi === "1"} href={chipHref("asi", "1")}>ASI members</FilterChip>
      <FilterChip active={params.earlyBird === "1"} href={chipHref("earlyBird", "1")}>Early-bird</FilterChip>
      <FilterChip active={params.booth === "1"} href={chipHref("booth", "1")}>Needs booth</FilterChip>
      <FilterChip active={params.interview === "1"} href={chipHref("interview", "1")}>Wants interview</FilterChip>
      <FilterChip active={params.video === "1"} href={chipHref("video", "1")}>Video submission</FilterChip>
    </div>
  );
}

function FilterChip({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-[color:var(--color-navy-900)] text-white border-[color:var(--color-navy-900)]"
          : "bg-white text-[color:var(--color-navy-700)] border-[color:var(--color-navy-100)] hover:border-[color:var(--color-navy-300)]"
      }`}
    >
      {children}
    </Link>
  );
}

function badgeForStatus(status: string) {
  if (status === "PAID" || status === "VERIFIED") return "badge-approved";
  if (status === "REJECTED") return "badge-rejected";
  if (status === "PENDING" || status === "RECEIPT_UPLOADED") return "badge-pending";
  return "badge-paid";
}
