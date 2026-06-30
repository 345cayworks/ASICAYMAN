import Link from "next/link";
import { ArrowRight, Briefcase, Compass, Gift, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AdBanner } from "@/components/ads/variants";
import { AD_PLACEMENTS } from "@/components/ads/placements";
import { PageWithRightColumn } from "@/components/ads/page-with-right-column";
import { SITE } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ welcome?: string }>;
}

export default async function DashboardHome({ searchParams }: Props) {
  const sessionUser = await requireUser();
  const params = await searchParams;
  const welcome = params.welcome === "1";

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { memberProfile: true, businessListings: true },
  });

  if (!user) return null;

  const profileCompleteness = computeProfileCompleteness(user);
  const memberProfile = user.memberProfile;
  const business = user.businessListings[0];

  return (
    <PageWithRightColumn
      adPlacement={AD_PLACEMENTS.memberDashboardRight}
      fallbackVariant="member"
      userRole={sessionUser.role}
    >
      {welcome && (
        <div className="card p-5 bg-[color:var(--color-gold-50)] border-[color:var(--color-gold-200)] flex gap-3 items-start">
          <CheckCircle2 size={20} className="text-[color:var(--color-gold-700)] mt-0.5" />
          <div>
            <h3 className="font-display text-lg">Welcome to the {SITE.name}.</h3>
            <p className="mt-1 text-sm text-[color:var(--color-navy-800)]">
              Your application is in review. Complete your profile and business listing to help speed things up.
            </p>
          </div>
        </div>
      )}

      <header>
        <p className="section-eyebrow">Dashboard</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl tracking-tight">
          Hi, {user.name?.split(" ")[0] ?? "there"}.
        </h1>
        <p className="mt-2 text-[color:var(--color-navy-700)]">
          Here&apos;s an overview of your {SITE.name} account.
        </p>
      </header>

      <AdBanner placement={AD_PLACEMENTS.dashboardTop} userRole={sessionUser.role} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatusCard
          icon={<CheckCircle2 size={16} />}
          label="Membership"
          value={memberProfile?.membershipStatus ?? "PENDING"}
          tone={statusTone(memberProfile?.membershipStatus)}
        />
        <StatusCard
          icon={<Briefcase size={16} />}
          label="Business listing"
          value={business ? business.status : "Not started"}
          tone={business ? statusTone(business.status) : "neutral"}
        />
        <StatusCard
          icon={<Gift size={16} />}
          label="Profile complete"
          value={`${profileCompleteness}%`}
          tone={profileCompleteness >= 80 ? "active" : "warn"}
        />
      </div>

      <section className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <p className="section-eyebrow">Your listing</p>
          <h3 className="mt-2 font-display text-xl">
            {business ? business.businessName : "List your business"}
          </h3>
          <p className="mt-3 text-sm text-[color:var(--color-navy-700)]">
            {business
              ? `Status: ${business.status.toLowerCase()}. Approved listings appear in the public marketplace.`
              : "Add your business to the marketplace so the community can find you."}
          </p>
          <Link
            href="/dashboard/business"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-navy-900)] hover:text-[color:var(--color-gold-600)]"
          >
            {business ? "Edit listing" : "Add your business"} <ArrowRight size={14} />
          </Link>
        </div>

        <div className="card p-6">
          <p className="section-eyebrow">Public marketplace</p>
          <h3 className="mt-2 font-display text-xl flex items-center gap-2">
            <Compass size={18} className="text-[color:var(--color-gold-600)]" />
            Browse the marketplace
          </h3>
          <p className="mt-3 text-sm text-[color:var(--color-navy-700)]">
            See how your listing appears alongside other Adventist-owned businesses across the Cayman Islands.
          </p>
          <Link
            href="/directory"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-navy-900)] hover:text-[color:var(--color-gold-600)]"
          >
            Open the marketplace <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section className="card p-6">
        <p className="section-eyebrow">Quick links</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <Link href="/dashboard/profile" className="p-4 rounded-lg border border-[color:var(--color-navy-100)] hover:border-[color:var(--color-navy-800)] transition-colors">
            <p className="font-medium text-[color:var(--color-navy-900)]">Edit profile</p>
            <p className="mt-1 text-xs text-[color:var(--color-navy-600)]">Bio, photo, contact details</p>
          </Link>
          <Link href="/dashboard/benefits" className="p-4 rounded-lg border border-[color:var(--color-navy-100)] hover:border-[color:var(--color-navy-800)] transition-colors">
            <p className="font-medium text-[color:var(--color-navy-900)]">Member benefits</p>
            <p className="mt-1 text-xs text-[color:var(--color-navy-600)]">What your membership unlocks</p>
          </Link>
          <Link href="/directory" className="p-4 rounded-lg border border-[color:var(--color-navy-100)] hover:border-[color:var(--color-navy-800)] transition-colors">
            <p className="font-medium text-[color:var(--color-navy-900)]">Public marketplace</p>
            <p className="mt-1 text-xs text-[color:var(--color-navy-600)]">See how your listing appears</p>
          </Link>
        </div>
      </section>
    </PageWithRightColumn>
  );
}

function StatusCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "active" | "warn" | "neutral" | "pending" }) {
  const toneClasses = {
    active: "text-[color:var(--color-teal-600)] bg-[color:var(--color-teal-500)]/10",
    warn: "text-[color:var(--color-gold-700)] bg-[color:var(--color-gold-100)]",
    pending: "text-[color:var(--color-gold-700)] bg-[color:var(--color-gold-100)]",
    neutral: "text-[color:var(--color-navy-700)] bg-[color:var(--color-navy-100)]",
  }[tone];
  return (
    <div className="card p-5">
      <div className={`size-8 rounded-full flex items-center justify-center ${toneClasses}`}>{icon}</div>
      <p className="mt-3 text-xs uppercase tracking-wider text-[color:var(--color-navy-600)]">{label}</p>
      <p className="mt-1 font-display text-lg leading-tight capitalize">{value.toLowerCase()}</p>
    </div>
  );
}

function statusTone(status?: string | null): "active" | "warn" | "pending" | "neutral" {
  if (!status) return "neutral";
  if (status === "ACTIVE" || status === "APPROVED") return "active";
  if (status === "PENDING") return "pending";
  return "warn";
}

function computeProfileCompleteness(user: {
  name: string | null; email: string; phone: string | null;
  memberProfile: { bio: string | null; profilePhotoUrl: string | null; churchAffiliation: string | null } | null;
}) {
  const fields = [
    !!user.name,
    !!user.email,
    !!user.phone,
    !!user.memberProfile?.bio,
    !!user.memberProfile?.profilePhotoUrl,
    !!user.memberProfile?.churchAffiliation,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}
