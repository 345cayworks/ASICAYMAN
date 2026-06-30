"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/directory", label: "Directory" },
  { href: "/membership", label: "Membership" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Don't render the public nav inside dashboard/admin shells
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--color-ivory)]/85 border-b border-[color:var(--color-navy-100)]">
      <nav className="mx-auto max-w-6xl px-5 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo />
          <span className="font-display text-lg tracking-tight text-[color:var(--color-navy-900)] leading-tight">
            <span className="hidden sm:inline">Adventist Business </span>
            <span className="sm:hidden">ABM </span>
            <span className="text-[color:var(--color-gold-600)]">Marketplace</span>
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full transition-colors",
                    active
                      ? "text-[color:var(--color-navy-900)] bg-[color:var(--color-cream)]"
                      : "text-[color:var(--color-navy-700)] hover:text-[color:var(--color-navy-900)]",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/auth/signin" className="btn btn-outline text-sm">
            Sign in
          </Link>
          <Link href="/membership/apply" className="btn btn-gold text-sm">
            Become a member
          </Link>
        </div>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-[color:var(--color-navy-100)] bg-[color:var(--color-ivory)]">
          <ul className="px-5 py-4 flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-[color:var(--color-navy-800)] hover:bg-[color:var(--color-cream)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-3 mt-2 border-t border-[color:var(--color-navy-100)] flex gap-2">
              <Link href="/auth/signin" onClick={() => setOpen(false)} className="btn btn-outline flex-1 text-sm">
                Sign in
              </Link>
              <Link href="/membership/apply" onClick={() => setOpen(false)} className="btn btn-gold flex-1 text-sm">
                Join
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0" aria-hidden>
      <circle cx="16" cy="16" r="15" stroke="var(--color-navy-900)" strokeWidth="1.5" />
      <path
        d="M9 21V12.5C9 10.567 10.567 9 12.5 9C14.433 9 16 10.567 16 12.5V21M16 12.5C16 10.567 17.567 9 19.5 9C21.433 9 23 10.567 23 12.5V21"
        stroke="var(--color-gold-500)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="1.6" fill="var(--color-gold-500)" />
    </svg>
  );
}
