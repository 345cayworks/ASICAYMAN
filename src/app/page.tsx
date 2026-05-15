import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Sparkles, Heart, Briefcase, GraduationCap, Users, Mail } from "lucide-react";
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
              <p className="section-eyebrow rise rise-1">Adventist-Laymen's Services & Industries · Cayman Islands</p>
              <h1 className="rise rise-2 mt-4 text-4xl md:text-5xl lg:text-6xl font-display leading-[1.05] tracking-tight">
                Connecting Adventist <span className="italic text-[color:var(--color-gold-600)]">Business</span>,
                <br className="hidden md:block" /> Ministry & Community Impact
              </h1>
              <p className="rise rise-3 mt-6 text-lg leading-relaxed text-[color:var(--color-navy-700)] max-w-2xl">
                ASI Cayman brings together Seventh-day Adventist business owners, professionals,
                entrepreneurs, and service-minded individuals to support Christ-centered outreach,
                economic empowerment, and community development across the Cayman Islands.
              </p>
              <div className="rise rise-4 mt-8 flex flex-wrap gap-3">
                <Link href="/expo/register" className="btn btn-gold">
                  Register for the Expo <ArrowRight size={16} />
                </Link>
                <Link href="/membership" className="btn btn-primary">
                  Become a member
                </Link>
                <Link href="/directory" className="btn btn-outline">
                  Explore businesses
                </Link>
              </div>
            </div>

            {/* Decorative hero card */}
            <div className="lg:col-span-5 rise rise-3">
              <ExpoSpotlight />
            </div>
          </div>
        </div>
      </section>

      {/* ============================ MISSION STRIP ============================ */}
      <section className="border-y border-[color:var(--color-navy-100)] bg-[color:var(--color-cream)]/40">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-10 grid md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1">
            <p className="section-eyebrow">Our mission</p>
            <h3 className="mt-2 font-display text-2xl">Sharing Christ in the marketplace.</h3>
          </div>
          <p className="md:col-span-2 text-[color:var(--color-navy-700)] leading-relaxed">
            We support Christ-centered outreach through business, health, education, evangelism,
            community service, family concerns, and special projects — a partnership of laypeople
            and ministry serving the Cayman Islands since 2001.
          </p>
        </div>
      </section>

      {/* ============================ FOUR PILLARS ============================ */}
      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-20">
        <SectionHeader
          eyebrow="What ASI Cayman does"
          title="Four ways we serve the islands"
          subtitle="Membership in ASI Cayman is about more than networking — it's a partnership for ministry, mentorship, and meaningful community impact."
        />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Pillar icon={<Briefcase size={20} />} title="Business & enterprise">
            Visibility, mentorship, and partnership opportunities for Adventist-owned businesses.
          </Pillar>
          <Pillar icon={<Heart size={20} />} title="Health & wellness">
            Free community screenings, lifestyle education, and health ministry partnerships.
          </Pillar>
          <Pillar icon={<GraduationCap size={20} />} title="Career & education">
            Career guidance for youth, students, and job seekers; scholarship support.
          </Pillar>
          <Pillar icon={<Users size={20} />} title="Community & family">
            Outreach, family concerns, and special projects with churches across Cayman.
          </Pillar>
        </div>
      </section>

      {/* ============================ EXPO FEATURE ============================ */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-20">
          <div className="card overflow-hidden">
            <div className="grid lg:grid-cols-5">
              <div className="lg:col-span-3 p-8 md:p-12">
                <p className="section-eyebrow">Featured event</p>
                <h2 className="mt-3 font-display text-3xl md:text-4xl tracking-tight">
                  Business & Career Expo <span className="italic text-[color:var(--color-gold-600)]">2026</span>
                </h2>
                <p className="mt-5 text-[color:var(--color-navy-700)] leading-relaxed max-w-xl">
                  A free, family-friendly afternoon celebrating Adventist-owned businesses in the
                  Cayman Islands. Discover local services, sample products, win prizes, and explore
                  career paths in business, healthcare, trades, and tech.
                </p>
                <dl className="mt-7 grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                  <div className="flex items-center gap-2.5 text-[color:var(--color-navy-800)]">
                    <Calendar size={16} className="text-[color:var(--color-gold-600)]" />
                    <dt className="sr-only">Date</dt><dd>{SITE.expo.date}</dd>
                  </div>
                  <div className="flex items-center gap-2.5 text-[color:var(--color-navy-800)]">
                    <Sparkles size={16} className="text-[color:var(--color-gold-600)]" />
                    <dt className="sr-only">Time</dt><dd>{SITE.expo.time} · Free admission</dd>
                  </div>
                  <div className="flex items-center gap-2.5 text-[color:var(--color-navy-800)] sm:col-span-2">
                    <MapPin size={16} className="text-[color:var(--color-gold-600)]" />
                    <dt className="sr-only">Location</dt><dd>{SITE.expo.location}</dd>
                  </div>
                </dl>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/expo" className="btn btn-primary">Learn more</Link>
                  <Link href="/expo/register" className="btn btn-gold">Register a booth <ArrowRight size={16} /></Link>
                </div>
              </div>
              <div className="lg:col-span-2 relative bg-gradient-to-br from-[color:var(--color-navy-900)] to-[color:var(--color-navy-700)] p-10 text-white flex flex-col justify-between min-h-[280px]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-gold-400)]">Public attractions</p>
                  <ul className="mt-4 space-y-2 text-sm text-white/90">
                    <li>· Free health screenings</li>
                    <li>· Career guidance for youth</li>
                    <li>· Local businesses & samples</li>
                    <li>· Massage therapy & wellness</li>
                    <li>· Prizes and giveaways</li>
                  </ul>
                </div>
                <p className="mt-8 font-display text-lg italic text-[color:var(--color-gold-200)]">
                  Showcase. Connect. Succeed.
                </p>
              </div>
            </div>
          </div>
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
                Be one of the first Adventist-owned businesses listed in the ASI Cayman directory.
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
            <h3 className="font-display text-2xl">Have a question or want to partner with ASI Cayman?</h3>
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

function ExpoSpotlight() {
  return (
    <div className="relative card overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--color-navy-900)] via-[color:var(--color-navy-800)] to-[color:var(--color-teal-600)]" />
      <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, var(--color-gold-300) 0%, transparent 35%), radial-gradient(circle at 80% 80%, var(--color-teal-400) 0%, transparent 40%)",
      }} />
      <div className="relative p-8 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-gold-300)]">June 28 · 2:00 PM</p>
        <h3 className="mt-3 font-display text-3xl leading-tight">
          Business & Career<br />Expo 2026
        </h3>
        <p className="mt-3 text-sm text-white/85 max-w-xs">
          The Lion Center, Grand Cayman. Free admission. Family friendly.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="badge bg-white/10 text-white">Free</span>
          <span className="badge bg-white/10 text-white">Health</span>
          <span className="badge bg-white/10 text-white">Career</span>
          <span className="badge bg-white/10 text-white">Prizes</span>
        </div>
        <p className="mt-8 font-display italic text-[color:var(--color-gold-200)]">
          Showcase. Connect. Succeed.
        </p>
      </div>
    </div>
  );
}
