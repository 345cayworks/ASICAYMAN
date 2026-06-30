import Link from "next/link";
import { MembershipApplicationForm } from "@/components/forms/membership-application-form";
import { MEMBERSHIP_CATEGORIES } from "@/lib/membership";

export const metadata = { title: "Membership application" };

const OBJECTIVES = [
  "To provide a forum for spiritual nurture, empowering members to model Christ in their business and professional life.",
  "To affirm the gifts of Adventist professionals and business persons and provide for their professional growth through relevant seminars, lectures, and workshops.",
  "To allow Adventist business and professional persons to network with each other formally and informally, facilitating mutual support, advertisement of products, and commercial growth.",
  "To enable members to focus on the mission of the Church, utilizing their spiritual, human and financial resources, individually and collectively, for the proclamation of the Gospel as they minister in the marketplace.",
  "To encourage business and professional persons to conduct their activities in full harmony with the standards and objectives of the Seventh-day Adventist Church and maintain harmonious relationships with the Church and its leadership.",
];

export default function MembershipApplyPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 pt-16 md:pt-20 pb-24">
      <p className="section-eyebrow">Membership</p>
      <h1 className="mt-4 font-display text-3xl md:text-4xl tracking-tight">
        Membership application
      </h1>

      <div className="mt-6 space-y-5 text-sm text-[color:var(--color-navy-700)] leading-relaxed">
        <div>
          <h2 className="font-display text-lg text-[color:var(--color-navy-900)]">
            About the community
          </h2>
          <p className="mt-2">
            The Adventist Business Community is an organisation of Seventh-day Adventist Church
            members in the Cayman Islands who work in the private sector in business and
            professional vocations. We recognise that our time, talents, treasures, and body
            temple belong to God, and that our vocations can and should be a form of service.
            Members commit to running their businesses with integrity and to participating in a
            shared community the public can trust. Our motto is{" "}
            <em>&ldquo;Sharing Christ in the Marketplace&rdquo;</em>.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-[color:var(--color-navy-900)]">Objectives</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-1.5">
            {OBJECTIVES.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="font-display text-lg text-[color:var(--color-navy-900)]">Eligibility</h2>
          <p className="mt-2">
            Membership is available to any Seventh-day Adventist Church member in good standing
            who operates a business, provides a professional service, or operates a supporting
            ministry, and whose business has been in operation for at least six months. Annual
            membership fees by category:
          </p>
          <ul className="mt-3 rounded-lg border border-[color:var(--color-navy-100)] divide-y divide-[color:var(--color-navy-100)]">
            {MEMBERSHIP_CATEGORIES.map((c) => (
              <li key={c.value} className="flex justify-between px-4 py-2.5">
                <span>{c.label}</span>
                <span className="font-medium text-[color:var(--color-gold-700)]">
                  CI${c.feeKyd}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-[color:var(--color-cream)] p-4">
          <h2 className="font-display text-base text-[color:var(--color-navy-900)]">
            Payment instructions
          </h2>
          <p className="mt-1.5">
            Payment should be made to RBC — <strong>ASI Cayman cheque account
            #06975-1154855</strong>. Receipts should be sent to{" "}
            <a className="underline" href="mailto:info@345guide.com">
              info@345guide.com
            </a>{" "}
            or WhatsApp to <strong>345 324 9000</strong>. You can submit your application now
            and send the receipt after payment.
          </p>
        </div>
      </div>

      <div className="mt-8 card p-7">
        <MembershipApplicationForm />
      </div>

      <p className="mt-6 text-sm text-center text-[color:var(--color-navy-700)]">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="text-[color:var(--color-navy-900)] underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
}
