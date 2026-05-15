import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SectionHeader } from "@/components/site/section-header";

export const metadata = { title: "Membership" };

const benefits = [
  { title: "Business visibility", body: "Listing in the ASI Cayman public business directory." },
  { title: "Networking", body: "Connect with fellow Adventist business owners and professionals." },
  { title: "Discounted expo pricing", body: "$100 booth rate at our annual Business & Career Expo." },
  { title: "Member resources", body: "Access to member-only announcements, training, and resources." },
  { title: "Promotional opportunities", body: "Featured listings, video features, and in-studio interview spots." },
  { title: "Community impact", body: "Join Christ-centered outreach across health, education, and community service." },
];

export default function MembershipPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 lg:px-8 pt-16 md:pt-24 pb-12">
        <p className="section-eyebrow">Membership</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-display tracking-tight max-w-3xl leading-tight">
          Belong to a fellowship of Adventist professionals.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[color:var(--color-navy-700)] leading-relaxed">
          ASI Cayman is open to Seventh-day Adventist business owners, professionals,
          entrepreneurs, students, and individuals who want to support Christ-centered
          enterprise and ministry in the Cayman Islands.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/signup" className="btn btn-gold">
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
          subtitle="Membership is about partnership — both what you gain and what you contribute."
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
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Join ASI Cayman today.</h2>
            <p className="mt-4 text-[color:var(--color-navy-700)] leading-relaxed">
              Create an account to get started. Once your application is reviewed, you'll have
              access to your member dashboard, the business listing form, expo registration, and
              member announcements.
            </p>
          </div>
          <div className="lg:col-span-2 flex flex-col gap-3">
            <Link href="/auth/signup" className="btn btn-primary">Create my account</Link>
            <Link href="/expo/register" className="btn btn-gold">Or just register a booth</Link>
            <p className="text-xs text-[color:var(--color-navy-600)] text-center">
              Already a member? <Link href="/auth/signin" className="underline underline-offset-4">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
