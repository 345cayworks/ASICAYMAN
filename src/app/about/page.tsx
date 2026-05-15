import Link from "next/link";
import { SectionHeader } from "@/components/site/section-header";

export const metadata = { title: "About ASI Cayman" };

const focusAreas = [
  { title: "Health", body: "Free community screenings, lifestyle education, partnership with local clinics." },
  { title: "Education", body: "Career guidance, mentoring, scholarships, and youth empowerment." },
  { title: "Evangelism", body: "Christ-centered outreach in partnership with local Adventist churches." },
  { title: "Community service", body: "Volunteering, disaster preparedness, neighborhood projects." },
  { title: "Family concerns", body: "Marriage, parenting, and family-life support resources." },
  { title: "Special projects", body: "Initiatives that respond to specific needs across the islands." },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 lg:px-8 pt-16 md:pt-24 pb-12">
        <p className="section-eyebrow">About ASI Cayman</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-display tracking-tight max-w-3xl">
          A fellowship of Adventist professionals serving the Cayman Islands.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-[color:var(--color-navy-700)] leading-relaxed">
          ASI — Adventist-Laymen's Services & Industries — is a worldwide membership organization
          of Seventh-day Adventist business owners, professionals, entrepreneurs, and
          service-minded individuals. We share Christ in the marketplace through business,
          ministry, mentorship, and community impact.
        </p>
      </section>

      <div className="hairline mx-auto max-w-6xl" />

      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-16 grid md:grid-cols-2 gap-12">
        <div>
          <p className="section-eyebrow">Our story</p>
          <h2 className="mt-2 font-display text-3xl">Formed in 2001.</h2>
          <p className="mt-5 text-[color:var(--color-navy-700)] leading-relaxed">
            ASI Cayman is the Cayman Islands chapter of ASI, organized in 2001 under the
            Inter-American Division. For more than two decades we have brought together Adventist
            laypeople and ministry to encourage one another, mentor the next generation, and serve
            the Caymanian community.
          </p>
          <p className="mt-4 text-[color:var(--color-navy-700)] leading-relaxed">
            We exist to support Christ-centered outreach through enterprise, professional service,
            and volunteerism — believing that work itself can be a ministry.
          </p>
        </div>
        <div className="card p-8">
          <p className="section-eyebrow">Worldwide family</p>
          <h3 className="mt-2 font-display text-2xl">Part of ASI, Inter-American Division.</h3>
          <p className="mt-4 text-sm text-[color:var(--color-navy-700)] leading-relaxed">
            We work in partnership with ASI chapters across the Caribbean and Latin America,
            sharing best practices, training, and outreach opportunities. Our work is grounded in
            the mission and message of the Seventh-day Adventist Church.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-16">
        <SectionHeader
          eyebrow="Focus areas"
          title="Where we serve."
          subtitle="Six interconnected areas of outreach guide ASI Cayman's work each year."
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
        <SectionHeader eyebrow="Leadership" title="Our team." />
        <div className="mt-10 card p-10 text-center">
          <p className="text-[color:var(--color-navy-700)] max-w-xl mx-auto">
            Our leadership and committee profiles will be published here as we update the chapter
            roster. Interested in serving? <Link href="/membership" className="underline underline-offset-4">Become a member</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
