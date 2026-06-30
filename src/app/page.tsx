import Link from "next/link";
import { ArrowRight, Briefcase, Users, Mail, Store, Compass, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/site/section-header";
import { SITE } from "@/lib/utils";

export default function HomePage() {
  return (
    <>
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 pt-16 md:pt-24 pb-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <p className="section-eyebrow rise rise-1">Adventist Business Marketplace · Cayman Islands</p>
              <h1 className="rise rise-2 mt-4 text-4xl md:text-5xl lg:text-6xl font-display leading-[1.05] tracking-tight">
                A marketplace of <span className="italic text-[color:var(--color-gold-600)]">Adventist</span>
                <br className="hidden md:block" /> businesses & professionals
              </h1>
              <p className="rise rise-3 mt-6 text-lg leading-relaxed text-[color:var(--color-navy-700)] max-w-2xl">
                {SITE.name} connects Seventh-day Adventist business owners, professionals,
                and entrepreneurs across the Cayman Islands with the community they serve —
                a trusted directory built around shared faith, integrity, and quality of work.
              </p>
              <div className="rise rise-4 mt-8 flex flex-wrap gap-3">
                <Link href="/directory" className="btn btn-gold">
                  Browse the marketplace <ArrowRight size={16} />
                </Link>
                <Link href="/membership/apply" className="btn btn-primary">
                  List your business
                </Link>
                <Link href="/about" className="btn btn-outline">
                  How it works
                </Link>
              </div>
            </div>

            {/* Decorative hero card */}
            <div className="lg:col-span-5 rise rise-3">
              <MarketplaceSpotlight />
            </div>
          </div>
        </div>
      </section>

      {/* ============================ MISSION STRIP ============================ */}
      <section className="border-y border-[color:var(--color-navy-100)] bg-[color:var(--color-cream)]/40">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-10 grid md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1">
            <p className="section-eyebrow">Why this marketplace</p>
            <h3 className="mt-2 font-display text-2xl">Faith, integrity, and quality in business.</h3>
          </div>
          <p className="md:col-span-2 text-[color:var(--color-navy-700)] leading-relaxed">
            We help the community find Adventist-owned businesses they can trust — and we help
            Adventist owners reach customers who share their values. One marketplace, built around
            relationships that already exist across the islands.
          </p>
        </div>
      </section>

      {/* ============================ FOUR PILLARS ============================ */}
      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-20">
        <SectionHeader
          eyebrow={`What ${SITE.shortName} offers`}
          title="Four ways the marketplace serves you"
          subtitle="Whether you're listing a business or looking for one, the marketplace is built around real, local connections."
        />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Pillar icon={<Store size={20} />} title="Trusted listings">
            Vetted profiles for Adventist-owned businesses, professionals, and tradespeople across the Cayman Islands.
          </Pillar>
          <Pillar icon={<Compass size={20} />} title="Easy discovery">
            Search by category, special offers, and location — find the right business in minutes.
          </Pillar>
          <Pillar icon={<Briefcase size={20} />} title="Business visibility">
            A clean public profile, member benefits, and a steady channel of customers who share your values.
          </Pillar>
          <Pillar icon={<Users size={20} />} title="Community">
            A network of owners and professionals who back each other through referrals and shared work.
          </Pillar>
        </div>
      </section>

      {/* ============================ DIRECTORY PREVIEW ============================ */}
      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-20">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <SectionHeader
            eyebrow="Business directory"
            title="Discover Adventist-owned businesses"
            subtitle="A growing directory of trusted local businesses across Grand Cayman."
          />
          <Link href="/directory" className="text-sm font-medium text-[color:var(--color-navy-800)] hover:text-[color:var(--color-gold-600)] inline-flex items-center gap-1.5">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-[color:var(--color-gold-200)] to-[color:var(--color-gold-400)]" />
                <div>
                  <p className="text-xs text-[color:var(--color-navy-500)]">Coming soon</p>
                  <h4 className="font-display text-lg">Featured business</h4>
                </div>
              </div>
              <p className="mt-4 text-sm text-[color:var(--color-navy-700)] leading-relaxed">
                Be one of the first Adventist-owned businesses listed in the marketplace.
              </p>
              <Link href="/membership" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-gold-700)] hover:text-[color:var(--color-gold-600)]">
                List your business <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ CONTACT STRIP ============================ */}
      <section className="border-t border-[color:var(--color-navy-100)] bg-[color:var(--color-cream)]/40">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-14 grid md:grid-cols-3 items-center gap-6">
          <div className="md:col-span-2">
            <h3 className="font-display text-2xl">Have a question or want to partner with us?</h3>
            <p className="mt-2 text-[color:var(--color-navy-700)]">
              Reach us at <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">{SITE.email}</a> or WhatsApp <a href={SITE.whatsappLink} className="underline underline-offset-4">{SITE.whatsapp}</a>.
            </p>
          </div>
          <div className="md:text-right">
            <Link href="/contact" className="btn btn-primary">
              <Mail size={16} /> Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Pillar({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 transition-transform hover:-translate-y-0.5">
      <div className="size-10 rounded-full bg-[color:var(--color-cream)] flex items-center justify-center text-[color:var(--color-gold-700)]">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg">{title}</h3>
      <p className="mt-2 text-sm text-[color:var(--color-navy-700)] leading-relaxed">{children}</p>
    </div>
  );
}

function MarketplaceSpotlight() {
  return (
    <div className="relative card overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--color-navy-900)] via-[color:var(--color-navy-800)] to-[color:var(--color-teal-600)]" />
      <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, var(--color-gold-300) 0%, transparent 35%), radial-gradient(circle at 80% 80%, var(--color-teal-400) 0%, transparent 40%)",
      }} />
      <div className="relative p-8 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-gold-300)]">
          {SITE.shortName} · Grand Cayman
        </p>
        <h3 className="mt-3 font-display text-3xl leading-tight">
          Adventist Business<br />Marketplace
        </h3>
        <p className="mt-3 text-sm text-white/85 max-w-xs">
          A trusted directory of Adventist-owned businesses, professionals, and tradespeople
          across the Cayman Islands.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-white/90">
          <li className="flex items-center gap-2.5">
            <CheckCircle2 size={14} className="text-[color:var(--color-gold-300)] shrink-0" />
            Vetted, Adventist-owned businesses
          </li>
          <li className="flex items-center gap-2.5">
            <CheckCircle2 size={14} className="text-[color:var(--color-gold-300)] shrink-0" />
            Search by category &amp; offer
          </li>
          <li className="flex items-center gap-2.5">
            <CheckCircle2 size={14} className="text-[color:var(--color-gold-300)] shrink-0" />
            Free for the community
          </li>
        </ul>
        <p className="mt-8 font-display italic text-[color:var(--color-gold-200)]">
          {SITE.tagline}
        </p>
      </div>
    </div>
  );
}
