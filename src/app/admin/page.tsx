import Link from "next/link";
import {
  Users,
  Briefcase,
  Ticket,
  ArrowRight,
  DollarSign,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDollars } from "@/lib/pricing";
import { DonutChart, type DonutDatum } from "@/components/charts/donut-chart";
import {
  HorizontalBarChart,
  VerticalBarChart,
  type BarDatum,
  type VBarDatum,
} from "@/components/charts/bar-chart";
import { Sparkline } from "@/components/charts/sparkline";
import {
  CHART_COLORS,
  colorForStatus,
  prettifyStatus,
} from "@/components/charts/colors";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;
const REG_TREND_DAYS = 14;
const MEMBER_TREND_DAYS = 30;

// Bucket records into N daily counts ending today (UTC days).
function dailyCounts(
  items: { createdAt: Date }[],
  days: number,
): VBarDatum[] {
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

export default async function AdminOverview() {
  const sinceRegWindow = new Date(Date.now() - REG_TREND_DAYS * DAY_MS);
  const sinceMemberWindow = new Date(Date.now() - MEMBER_TREND_DAYS * DAY_MS);

  const [
    membersByStatus,
    listingsByStatus,
    registrationsByStatus,
    expoRevenueAgg,
    pendingReceipts,
    recentRegistrationsInWindow,
    recentMembersInWindow,
    recentRegistrationsList,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.businessListing.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.expoRegistration.groupBy({
      by: ["paymentStatus"],
      _count: { _all: true },
    }),
    prisma.expoRegistration.aggregate({
      _sum: { paymentAmount: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.paymentReceipt.count({ where: { status: "UPLOADED" } }),
    prisma.expoRegistration.findMany({
      where: { createdAt: { gte: sinceRegWindow } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: sinceMemberWindow } },
      select: { createdAt: true },
    }),
    prisma.expoRegistration.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalMembers = membersByStatus.reduce(
    (s, g) => s + g._count._all,
    0,
  );
  const activeMembers =
    membersByStatus.find((g) => g.status === "ACTIVE")?._count._all ?? 0;
  const pendingMembers =
    membersByStatus.find((g) => g.status === "PENDING")?._count._all ?? 0;
  const approvedListings =
    listingsByStatus.find((g) => g.status === "APPROVED")?._count._all ?? 0;
  const pendingListings =
    listingsByStatus.find((g) => g.status === "PENDING")?._count._all ?? 0;
  const totalRegistrations = registrationsByStatus.reduce(
    (s, g) => s + g._count._all,
    0,
  );
  const paidRegistrations =
    registrationsByStatus.find((g) => g.paymentStatus === "PAID")?._count
      ._all ?? 0;
  const pendingRegistrations = registrationsByStatus
    .filter((g) =>
      ["PENDING", "RECEIPT_UPLOADED"].includes(g.paymentStatus),
    )
    .reduce((s, g) => s + g._count._all, 0);
  const expoRevenue = expoRevenueAgg._sum.paymentAmount ?? 0;

  const memberSparkline = dailyCounts(
    recentMembersInWindow,
    MEMBER_TREND_DAYS,
  ).map((d) => d.value);
  const regTrend = dailyCounts(recentRegistrationsInWindow, REG_TREND_DAYS);
  const regTrendTotal = regTrend.reduce((s, d) => s + d.value, 0);

  const regDonut: DonutDatum[] = registrationsByStatus
    .map((g) => ({
      label: prettifyStatus(g.paymentStatus),
      value: g._count._all,
      color: colorForStatus(g.paymentStatus),
    }))
    .sort((a, b) => b.value - a.value);

  const memberBars: BarDatum[] = membersByStatus
    .map((g) => ({
      label: prettifyStatus(g.status),
      value: g._count._all,
      color: colorForStatus(g.status),
    }))
    .sort((a, b) => b.value - a.value);

  const listingBars: BarDatum[] = listingsByStatus
    .map((g) => ({
      label: prettifyStatus(g.status),
      value: g._count._all,
      color: colorForStatus(g.status),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid gap-8">
      <header>
        <p className="section-eyebrow">Overview</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          Admin console
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
          Snapshot of the ASI Cayman portal.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={16} />}
          label="Members (active)"
          value={activeMembers}
          sub={`${pendingMembers} pending`}
          href="/admin/members"
          spark={memberSparkline}
          sparkLabel={`New users last ${MEMBER_TREND_DAYS} days`}
        />
        <StatCard
          icon={<Briefcase size={16} />}
          label="Listings (approved)"
          value={approvedListings}
          sub={`${pendingListings} pending`}
          href="/admin/listings"
        />
        <StatCard
          icon={<Ticket size={16} />}
          label="Expo paid"
          value={paidRegistrations}
          sub={`${pendingRegistrations} pending payment`}
          href="/admin/registrations"
        />
        <StatCard
          icon={<DollarSign size={16} />}
          label="Expo revenue"
          value={formatDollars(expoRevenue)}
          sub="Verified payments"
          href="/admin/registrations"
          accent
        />
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <ReportCard
          eyebrow="Expo payments"
          title="Status distribution"
          href="/admin/registrations"
          className="lg:col-span-1"
        >
          <DonutChart
            data={regDonut}
            ariaLabel="Expo registrations by payment status"
            centerLabel={{
              value: totalRegistrations,
              sub: totalRegistrations === 1 ? "registration" : "registrations",
            }}
          />
        </ReportCard>

        <ReportCard
          eyebrow="Registrations"
          title={`Last ${REG_TREND_DAYS} days`}
          icon={<TrendingUp size={14} />}
          href="/admin/registrations"
          className="lg:col-span-2"
          afterTitle={
            <span className="text-xs text-[color:var(--color-navy-600)] tabular-nums">
              {regTrendTotal} new
            </span>
          }
        >
          <VerticalBarChart
            data={regTrend}
            ariaLabel={`Daily new registrations over the last ${REG_TREND_DAYS} days`}
            height={120}
            color={CHART_COLORS.neutralDeep}
          />
        </ReportCard>
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <ReportCard
          eyebrow="Members"
          title="By status"
          href="/admin/members"
        >
          <HorizontalBarChart
            data={memberBars}
            ariaLabel="Members by status"
            emptyLabel="No members yet"
          />
          <p className="mt-4 text-xs text-[color:var(--color-navy-600)]">
            {totalMembers} total user{totalMembers === 1 ? "" : "s"}.
          </p>
        </ReportCard>

        <ReportCard
          eyebrow="Listings"
          title="By status"
          href="/admin/listings"
        >
          <HorizontalBarChart
            data={listingBars}
            ariaLabel="Business listings by status"
            emptyLabel="No listings yet"
          />
        </ReportCard>

        <ReportCard
          eyebrow="Receipts queue"
          title="Awaiting review"
          icon={<ClipboardList size={14} />}
          href="/admin/receipts"
        >
          <p className="font-display text-5xl text-[color:var(--color-navy-900)] tabular-nums leading-none">
            {pendingReceipts}
          </p>
          <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
            {pendingReceipts === 1
              ? "receipt waiting on you"
              : "receipts waiting on you"}
          </p>
          <Link
            href="/admin/receipts"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-navy-900)] hover:text-[color:var(--color-gold-600)]"
          >
            Open queue <ArrowRight size={14} />
          </Link>
        </ReportCard>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="section-eyebrow">Latest expo registrations</p>
            <h2 className="mt-1 font-display text-xl">Most recent activity</h2>
          </div>
          <Link
            href="/admin/registrations"
            className="text-sm text-[color:var(--color-navy-800)] hover:text-[color:var(--color-gold-600)] inline-flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <ul className="mt-5 divide-y divide-[color:var(--color-navy-100)]">
          {recentRegistrationsList.length === 0 ? (
            <li className="py-3 text-sm text-[color:var(--color-navy-600)]">
              No registrations yet.
            </li>
          ) : (
            recentRegistrationsList.map((r) => (
              <li
                key={r.id}
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: colorForStatus(r.paymentStatus) }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.businessName}</p>
                    <p className="text-xs text-[color:var(--color-navy-600)] truncate">
                      {r.fullName} · {r.email}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[color:var(--color-navy-600)] uppercase tracking-wider tabular-nums shrink-0">
                  {prettifyStatus(r.paymentStatus)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
  spark,
  sparkLabel,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  href: string;
  spark?: number[];
  sparkLabel?: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card p-5 hover:-translate-y-0.5 transition-transform relative overflow-hidden ${
        accent ? "ring-1 ring-[color:var(--color-gold-200)]" : ""
      }`}
    >
      {accent && (
        <span
          aria-hidden
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(to right, var(--color-gold-300), var(--color-gold-500))`,
          }}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="size-8 rounded-full bg-[color:var(--color-cream)] flex items-center justify-center text-[color:var(--color-gold-700)]">
          {icon}
        </div>
        {spark && spark.length >= 2 && (
          <Sparkline
            data={spark}
            filled
            color={CHART_COLORS.pendingDeep}
            ariaLabel={sparkLabel}
          />
        )}
      </div>
      <p className="mt-3 text-xs uppercase tracking-wider text-[color:var(--color-navy-600)]">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
      <p className="text-xs text-[color:var(--color-navy-600)]">{sub}</p>
    </Link>
  );
}

function ReportCard({
  eyebrow,
  title,
  icon,
  href,
  afterTitle,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  icon?: React.ReactNode;
  href?: string;
  afterTitle?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`card p-6 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-eyebrow">{eyebrow}</p>
          <h2 className="mt-1 font-display text-lg flex items-center gap-1.5">
            {icon}
            {title}
          </h2>
        </div>
        {afterTitle}
      </div>
      <div className="mt-5">{children}</div>
      {href && (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-navy-700)] hover:text-[color:var(--color-gold-600)]"
        >
          Open report <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}
