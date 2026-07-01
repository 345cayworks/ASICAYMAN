"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/directory", label: "Directory" },
  { href: "/blog", label: "Blog" },
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
          <Image
            src="/logo-mark.png"
            alt="Adventist Business Community"
            width={36}
            height={36}
            priority
            className="shrink-0 h-9 w-9"
          />
          <span className="font-display text-lg tracking-tight text-[color:var(--color-navy-900)] leading-tight">
            <span className="hidden sm:inline">Adventist Business </span>
            <span className="sm:hidden">ABC </span>
            <span className="text-[color:var(--color-gold-600)]">Community</span>
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
