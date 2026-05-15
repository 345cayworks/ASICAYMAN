import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { signOut } from "@/lib/auth";
import { LayoutDashboard, Users, Briefcase, Ticket, Receipt, Megaphone, LogOut, ArrowLeft } from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Briefcase },
  { href: "/admin/registrations", label: "Expo registrations", icon: Ticket },
  { href: "/admin/receipts", label: "Receipts", icon: Receipt },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-[color:var(--color-navy-950)] text-[color:var(--color-navy-100)]">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="flex items-center gap-2.5 mb-1 pl-2">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
              <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="1.5" />
              <path d="M9 21V12.5C9 10.567 10.567 9 12.5 9C14.433 9 16 10.567 16 12.5V21M16 12.5C16 10.567 17.567 9 19.5 9C21.433 9 23 10.567 23 12.5V21" stroke="var(--color-gold-400)" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="16" cy="16" r="1.6" fill="var(--color-gold-400)" />
            </svg>
            <span className="font-display text-lg tracking-tight text-white">
              ASI <span className="text-[color:var(--color-gold-400)]">Cayman</span>
            </span>
          </div>
          <p className="pl-12 -mt-0.5 text-xs uppercase tracking-[0.18em] text-[color:var(--color-gold-400)]">Admin</p>

          <nav className="mt-8 grid gap-0.5">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[color:var(--color-navy-200)] hover:bg-white/10 hover:text-white transition-colors"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[color:var(--color-navy-300)] hover:text-white"
            >
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
          </nav>

          <div className="my-6 h-px bg-white/10" />

          <div className="px-2">
            <p className="text-xs text-[color:var(--color-navy-300)]">Signed in as</p>
            <p className="mt-0.5 text-sm font-medium text-white truncate">{user.name ?? user.email}</p>
            <p className="text-xs text-[color:var(--color-navy-400)]">{user.role}</p>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="mt-4 flex items-center gap-2 text-sm text-[color:var(--color-navy-200)] hover:text-white">
                <LogOut size={14} /> Sign out
              </button>
            </form>
          </div>
        </aside>

        <main className="bg-[color:var(--color-ivory)] text-[color:var(--color-navy-900)] rounded-2xl p-6 md:p-8 min-h-[80vh]">
          {children}
        </main>
      </div>
    </div>
  );
}
