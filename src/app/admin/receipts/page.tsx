import { prisma } from "@/lib/db";
import { formatDollars } from "@/lib/pricing";
import { markPaid, rejectPayment } from "@/app/admin/actions";
import { CheckCircle2, X, TrendingUp, ClipboardList } from "lucide-react";
import { DonutChart, type DonutDatum } from "@/components/charts/donut-chart";
import { VerticalBarChart, type VBarDatum } from "@/components/charts/bar-chart";
import {
  CHART_COLORS,
  colorForStatus,
  prettifyStatus,
} from "@/components/charts/colors";

export const dynamic = "force-dynamic";
export const metadata = { title: "Receipts queue" };

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
    labels.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  }
  for (const it of items) {
    const t = new Date(it.createdAt);
    t.setUTCHours(0, 0, 0, 0);
    const idx = Math.floor((t.getTime() - start) / DAY_MS);
    if (idx >= 0 && idx < days) buckets[idx]++;
  }
  return buckets.map((value, i) => ({ label: labels[i], value }));
}

export default async function AdminReceiptsPage() {
  const sinceTrend = new Date(Date.now() - TREND_DAYS * DAY_MS);
  const [pending, statusBreakdown, recentUploads] = await Promise.all([
    prisma.paymentReceipt.findMany({
      where: { status: "UPLOADED" },
      orderBy: { createdAt: "asc" },
      include: { expoRegistration: true, user: true },
    }),
    prisma.paymentReceipt.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.paymentReceipt.findMany({
      where: { createdAt: { gte: sinceTrend } },
      select: { createdAt: true },
    }),
  ]);

  const totalReceipts = statusBreakdown.reduce((s, g) => s + g._count._all, 0);
  const statusDonut: DonutDatum[] = statusBreakdown
    .map((g) => ({
      label: prettifyStatus(g.status),
      value: g._count._all,
      color: colorForStatus(g.status),
    }))
    .sort((a, b) => b.value - a.value);
  const uploadTrend = dailyCounts(recentUploads, TREND_DAYS);
  const trendTotal = uploadTrend.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid gap-6">
      <header>
        <p className="section-eyebrow">Admin</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Receipts awaiting review</h1>
        <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
          {pending.length} {pending.length === 1 ? "receipt" : "receipts"} pending review.
        </p>
      </header>

      <section className="grid lg:grid-cols-[1fr_1fr_auto] gap-5">
        <div className="card p-5">
          <p className="section-eyebrow flex items-center gap-1.5">
            <ClipboardList size={12} /> Queue depth
          </p>
          <p className="mt-3 font-display text-4xl text-[color:var(--color-navy-900)] tabular-nums leading-none">
            {pending.length}
          </p>
          <p className="mt-2 text-xs text-[color:var(--color-navy-600)]">
            waiting on review ·{" "}
            <span className="text-[color:var(--color-navy-800)]">
              {totalReceipts} total receipts
            </span>
          </p>
        </div>
        <div className="card p-5">
          <p className="section-eyebrow flex items-center gap-1.5">
            <TrendingUp size={12} /> Uploads · last {TREND_DAYS} days
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-3xl text-[color:var(--color-navy-900)] tabular-nums">
              {trendTotal}
            </span>
            <span className="text-xs text-[color:var(--color-navy-600)]">
              new upload{trendTotal === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4">
            <VerticalBarChart
              data={uploadTrend}
              height={68}
              color={CHART_COLORS.neutralDeep}
              ariaLabel={`Daily receipt uploads over the last ${TREND_DAYS} days`}
            />
          </div>
        </div>
        <div className="card p-5 min-w-0">
          <p className="section-eyebrow">Lifetime status</p>
          <div className="mt-3">
            <DonutChart
              data={statusDonut}
              size={120}
              strokeWidth={14}
              ariaLabel="All receipts by status"
              centerLabel={{ value: totalReceipts, sub: "total" }}
              emptyLabel="No receipts yet"
            />
          </div>
        </div>
      </section>

      {pending.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle2 size={28} className="mx-auto text-[color:var(--color-teal-600)]" />
          <p className="mt-3 text-[color:var(--color-navy-700)]">All caught up.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.map((r) => (
            <article key={r.id} className="card p-5 grid md:grid-cols-[1fr_auto] gap-5 items-start">
              <div>
                <p className="text-xs uppercase tracking-wider text-[color:var(--color-navy-600)]">{r.paymentMethod}</p>
                <p className="mt-1 font-display text-xl">
                  {r.expoRegistration?.businessName ?? "—"}
                </p>
                <p className="text-sm text-[color:var(--color-navy-700)]">
                  {r.expoRegistration?.fullName} · {r.expoRegistration?.email}
                </p>
                <p className="mt-2 text-sm">
                  Amount: <strong>{formatDollars(r.amount)}</strong> · uploaded {r.createdAt.toLocaleDateString()}
                </p>
                <a href={r.receiptFileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-navy-900)] underline">
                  View receipt file
                </a>
              </div>
              <div className="flex flex-col gap-2 md:min-w-[200px]">
                {r.expoRegistrationId && (
                  <>
                    <form action={markPaid}>
                      <input type="hidden" name="registrationId" value={r.expoRegistrationId} />
                      <button className="btn btn-primary text-sm w-full"><CheckCircle2 size={14} /> Approve & mark paid</button>
                    </form>
                    <form action={rejectPayment} className="flex flex-col gap-1">
                      <input type="hidden" name="registrationId" value={r.expoRegistrationId} />
                      <input name="note" placeholder="Reason (optional)" className="field-input text-sm" />
                      <button className="btn btn-outline text-sm w-full"><X size={14} /> Reject</button>
                    </form>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
