import Link from "next/link";
import { SectionHeader } from "@/components/site/section-header";
import { SITE } from "@/lib/utils";

export const metadata = { title: "About the marketplace" };

const focusAreas = [
  { title: "Trust", body: "Listings are vetted so the community can find Adventist-owned businesses they can rely on." },
  { title: "Visibility", body: "A clean public profile that puts Adventist-owned businesses in front of the right customers." },
  { title: "Discovery", body: "Search by category, special offers, and location across Grand Cayman and beyond." },
  { title: "Community", body: "Owners and professionals who back each other through referrals and shared work." },
  { title: "Quality", body: "Members commit to integrity and a standard of work the community can recommend." },
  { title: "Service", body: "Christ-centered work — believing that everyday business can be a form of service." },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 lg:px-8 pt-16 md:pt-24 pb-12">
        <p className="section-eyebrow">About the marketplace</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-display tracking-tight max-w-3xl">
          A trusted marketplace of Adventist-owned businesses in the Cayman Islands.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-[color:var(--color-navy-700)] leading-relaxed">
          The {SITE.name} is a directory and community of Seventh-day Adventist business owners,
          professionals, and entrepreneurs across the Cayman Islands — built around shared faith,
          integrity, and quality of work.
        </p>
      </section>

      <div className="hairline mx-auto max-w-6xl" />

      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-16 grid md:grid-cols-2 gap-12">
        <div>
          <p className="section-eyebrow">How it works</p>
          <h2 className="mt-2 font-display text-3xl">For owners and the community.</h2>
          <p className="mt-5 text-[color:var(--color-navy-700)] leading-relaxed">
            Business owners apply for a listing, complete a short profile, and once approved they
            appear in the public marketplace alongside other Adventist-owned businesses on the
            island.
          </p>
          <p className="mt-4 text-[color:var(--color-navy-700)] leading-relaxed">
            The community can search the marketplace by category, special offers, and location —
            free of charge — to find the right business in minutes.
          </p>
        </div>
        <div className="card p-8">
          <p className="section-eyebrow">Our roots</p>
          <h3 className="mt-2 font-display text-2xl">Built on community relationships.</h3>
          <p className="mt-4 text-sm text-[color:var(--color-navy-700)] leading-relaxed">
            The marketplace is organised by Seventh-day Adventist business leaders in the Cayman
            Islands. Listings are vetted and we work directly with owners across the islands to
            keep the directory current and trustworthy.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-16">
        <SectionHeader
          eyebrow="What we stand for"
          title="What the marketplace is built on."
          subtitle="Six values that shape how we run the marketplace and how members serve the community."
        />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {focusAreas.map((f) => (
            <div key={f.title} className="card p-6">
              <h4 className="font-display text-lg text-[color:var(--color-navy-900)]">{f.title}</h4>
              <p className="mt-2 text-sm text-[color:var(--color-navy-700)] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-16">
        <SectionHeader eyebrow="Get listed" title="Ready to join?" />
        <div className="mt-10 card p-10 text-center">
          <p className="text-[color:var(--color-navy-700)] max-w-xl mx-auto">
            Adventist-owned business in the Cayman Islands?{" "}
            <Link href="/membership/apply" className="underline underline-offset-4">
              Apply for membership
            </Link>{" "}
            to add your listing to the marketplace.
          </p>
        </div>
      </section>
    </>
  );
}
