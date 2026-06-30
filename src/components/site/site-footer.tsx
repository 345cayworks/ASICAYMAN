"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/utils";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-24 bg-[color:var(--color-navy-950)] text-[color:var(--color-navy-100)]">
      <div className="mx-auto max-w-6xl px-5 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <h3 className="font-display text-2xl text-white">{SITE.name}</h3>
            <p className="mt-3 text-sm text-[color:var(--color-navy-200)] max-w-md leading-relaxed">
              A directory and community of Seventh-day Adventist business owners,
              professionals, and entrepreneurs serving the Cayman Islands.
            </p>
            <p className="mt-4 text-xs tracking-[0.18em] uppercase text-[color:var(--color-gold-400)]">
              {SITE.tagline}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-[color:var(--color-navy-200)]">
              <li><Link href="/about" className="hover:text-white">About us</Link></li>
              <li><Link href="/directory" className="hover:text-white">Business directory</Link></li>
              <li><Link href="/membership" className="hover:text-white">Membership</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
            <ul className="space-y-2.5 text-sm text-[color:var(--color-navy-200)]">
              <li>
                <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 hover:text-white">
                  <Mail size={14} /> {SITE.email}
                </a>
              </li>
              <li>
                <a href={SITE.whatsappLink} className="inline-flex items-center gap-2 hover:text-white">
                  <MessageCircle size={14} /> WhatsApp {SITE.whatsapp}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between gap-3 text-xs text-[color:var(--color-navy-300)]">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>Built with care for the Cayman Adventist community.</p>
        </div>
      </div>
    </footer>
  );
}
