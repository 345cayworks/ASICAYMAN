import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SectionHeader } from "@/components/site/section-header";
import { SITE } from "@/lib/utils";

export const metadata = { title: "Membership" };

const benefits = [
  { title: "Public listing", body: "Your business in the Adventist Business Community directory, searchable by category and offer." },
  { title: "Trusted network", body: "Connect with fellow Adventist business owners and professionals across the Cayman Islands." },
  { title: "Featured placement", body: "Eligibility for featured listings, special-offer highlights, and seasonal spotlights." },
  { title: "Member resources", body: "Access to member-only announcements, training, and platform updates." },
  { title: "Community referrals", body: "Members regularly send work to one another and to vetted partners in the community." },
  { title: "Purpose-built", body: "A community shaped around shared faith, integrity, and quality of work." },
];

export default function MembershipPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 lg:px-8 pt-16 md:pt-24 pb-12">
        <p className="section-eyebrow">Membership</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-display tracking-tight max-w-3xl leading-tight">
          List your business in a community the public trusts.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[color:var(--color-navy-700)] leading-relaxed">
          The {SITE.name} is open to Seventh-day Adventist business owners, professionals,
          entrepreneurs, and tradespeople in the Cayman Islands who want to put their work
          in front of customers who share their values.
        </p>

        <p className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--color-gold-700)] font-semibold">
          <span className="size-1.5 rounded-full bg-[color:var(--color-gold-500)]" aria-hidden />
          Free to join · open application
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/membership/apply" className="btn btn-gold">
            Become a member <ArrowRight size={16} />
          </Link>
          <Link href="/contact" className="btn btn-outline">Ask a question</Link>
        </div>
      </section>

      <div className="hairline mx-auto max-w-6xl" />

      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-20">
        <SectionHeader
          eyebrow="Why join"
          title="What you get."
          subtitle="Membership is the on-ramp to a listing — and to a community of owners backing each other up."
        />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b) => (
            <div key={b.title} className="card p-6">
              <div className="size-9 rounded-full bg-[color:var(--color-gold-100)] flex items-center justify-center text-[color:var(--color-gold-700)]">
                <Check size={18} />
              </div>
              <h4 className="mt-4 font-display text-lg">{b.title}</h4>
              <p className="mt-2 text-sm text-[color:var(--color-navy-700)] leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 lg:px-8 pb-20">
        <div className="card p-10 md:p-14 grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-3">
            <p className="section-eyebrow">Ready to start?</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Apply to be listed.</h2>
            <p className="mt-4 text-[color:var(--color-navy-700)] leading-relaxed">
              Create an account to get started. Once your application is reviewed, you&apos;ll have
              access to your dashboard, the business listing form, and member announcements.
            </p>
          </div>
          <div className="lg:col-span-2 flex flex-col gap-3">
            <Link href="/membership/apply" className="btn btn-primary">Apply for membership</Link>
            <Link href="/directory" className="btn btn-outline">Browse the directory</Link>
            <p className="text-xs text-[color:var(--color-navy-600)] text-center">
              Already a member? <Link href="/auth/signin" className="underline underline-offset-4">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
