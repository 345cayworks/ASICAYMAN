import Link from "next/link";
import { Users, Briefcase, Ticket, Receipt, ArrowRight, DollarSign, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDollars } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [
    pendingMembers, activeMembers, pendingListings, approvedListings,
    pendingRegistrations, paidRegistrations, pendingReceipts, expoRevenueAgg,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.businessListing.count({ where: { status: "PENDING" } }),
    prisma.businessListing.count({ where: { status: "APPROVED" } }),
    prisma.expoRegistration.count({ where: { paymentStatus: { in: ["PENDING", "RECEIPT_UPLOADED"] } } }),
    prisma.expoRegistration.count({ where: { paymentStatus: "PAID" } }),
    prisma.paymentReceipt.count({ where: { status: "UPLOADED" } }),
    prisma.expoRegistration.aggregate({
      _sum: { paymentAmount: true },
      where: { paymentStatus: "PAID" },
    }),
  ]);

  const recentRegistrations = await prisma.expoRegistration.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-8">
      <header>
        <p className="section-eyebrow">Overview</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Admin console</h1>
        <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">Snapshot of the ASI Cayman portal.</p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={16} />} label="Members (active)" value={activeMembers} sub={`${pendingMembers} pending`} href="/admin/members" />
        <StatCard icon={<Briefcase size={16} />} label="Listings (approved)" value={approvedListings} sub={`${pendingListings} pending`} href="/admin/listings" />
        <StatCard icon={<Ticket size={16} />} label="Expo paid" value={paidRegistrations} sub={`${pendingRegistrations} pending payment`} href="/admin/registrations" />
        <StatCard icon={<DollarSign size={16} />} label="Expo revenue" value={formatDollars(expoRevenueAgg._sum.paymentAmount ?? 0)} sub="Verified payments" href="/admin/registrations" />
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="section-eyebrow">Receipts queue</p>
            <Link href="/admin/receipts" className="text-sm text-[color:var(--color-navy-800)] hover:text-[color:var(--color-gold-600)] inline-flex items-center gap-1">
              Open <ArrowRight size={14} />
            </Link>
          </div>
          <p className="mt-4 font-display text-4xl text-[color:var(--color-navy-900)]">{pendingReceipts}</p>
          <p className="mt-1 text-sm text-[color:var(--color-navy-700)]">receipts awaiting review</p>
        </div>

        <div className="card p-6">
          <p className="section-eyebrow">Latest expo registrations</p>
          <ul className="mt-4 divide-y divide-[color:var(--color-navy-100)]">
            {recentRegistrations.length === 0 ? (
              <li className="py-3 text-sm text-[color:var(--color-navy-600)]">No registrations yet.</li>
            ) : (
              recentRegistrations.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.businessName}</p>
                    <p className="text-xs text-[color:var(--color-navy-600)] truncate">{r.fullName} · {r.email}</p>
                  </div>
                  <span className={`badge ${badgeForStatus(r.paymentStatus)}`}>{r.paymentStatus.replace(/_/g, " ")}</span>
                </li>
              ))
            )}
          </ul>
          <Link href="/admin/registrations" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-navy-900)] hover:text-[color:var(--color-gold-600)]">
            View all registrations <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, sub, href }: { icon: React.ReactNode; label: string; value: string | number; sub: string; href: string }) {
  return (
    <Link href={href} className="card p-5 hover:-translate-y-0.5 transition-transform">
      <div className="size-8 rounded-full bg-[color:var(--color-cream)] flex items-center justify-center text-[color:var(--color-gold-700)]">{icon}</div>
      <p className="mt-3 text-xs uppercase tracking-wider text-[color:var(--color-navy-600)]">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      <p className="text-xs text-[color:var(--color-navy-600)]">{sub}</p>
    </Link>
  );
}

function badgeForStatus(status: string) {
  if (status === "PAID" || status === "VERIFIED") return "badge-approved";
  if (status === "REJECTED") return "badge-rejected";
  if (status === "PENDING" || status === "RECEIPT_UPLOADED") return "badge-pending";
  return "badge-paid";
}
