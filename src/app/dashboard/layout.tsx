import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { SignOutButton } from "@/components/site/sign-out-button";
import { SponsoredCard } from "@/components/ads/variants";
import { AD_PLACEMENTS } from "@/components/ads/placements";
import { Home, User, Briefcase, Ticket, Gift, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/business", label: "My business", icon: Briefcase },
  { href: "/dashboard/registration", label: "Expo registration", icon: Ticket },
  { href: "/dashboard/benefits", label: "Member benefits", icon: Gift },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

  return (
    <div className="min-h-screen bg-[color:var(--color-ivory)]">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <Link href="/" className="flex items-center gap-2.5 mb-8 pl-2">
            <DashLogo />
            <span className="font-display text-lg tracking-tight">
              ASI <span className="text-[color:var(--color-gold-600)]">Cayman</span>
            </span>
          </Link>

          <nav className="grid gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[color:var(--color-navy-800)] hover:bg-white transition-colors"
              >
                <item.icon size={16} className="text-[color:var(--color-navy-500)]" />
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[color:var(--color-gold-700)] bg-[color:var(--color-gold-50)] hover:bg-[color:var(--color-gold-100)]"
              >
                <ShieldCheck size={16} /> Admin console
              </Link>
            )}
          </nav>

          <div className="hairline my-6" />

          <div className="px-2">
            <p className="text-xs text-[color:var(--color-navy-600)]">Signed in as</p>
            <p className="mt-0.5 text-sm font-medium text-[color:var(--color-navy-900)] truncate">{user.name ?? user.email}</p>
            <p className="text-xs text-[color:var(--color-navy-600)] truncate">{user.email}</p>

            <SignOutButton className="mt-4 flex items-center gap-2 text-sm text-[color:var(--color-navy-700)] hover:text-[color:var(--color-navy-900)] disabled:opacity-60" />
          </div>

          <div className="mt-6 hidden lg:block">
            <SponsoredCard placement={AD_PLACEMENTS.sidebar} userRole={user.role} />
          </div>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}

function DashLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="15" stroke="var(--color-navy-900)" strokeWidth="1.5" />
      <path d="M9 21V12.5C9 10.567 10.567 9 12.5 9C14.433 9 16 10.567 16 12.5V21M16 12.5C16 10.567 17.567 9 19.5 9C21.433 9 23 10.567 23 12.5V21" stroke="var(--color-gold-500)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="16" r="1.6" fill="var(--color-gold-500)" />
    </svg>
  );
}
