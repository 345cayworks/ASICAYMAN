import Link from "next/link";
import { MembershipApplicationForm } from "@/components/forms/membership-application-form";

export const metadata = { title: "Apply for membership" };

export default function MembershipApplyPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 pt-16 md:pt-20 pb-24">
      <p className="section-eyebrow">Membership</p>
      <h1 className="mt-4 font-display text-3xl md:text-4xl tracking-tight">
        Apply to become a member.
      </h1>
      <p className="mt-3 text-[color:var(--color-navy-700)] leading-relaxed">
        Join a fellowship of Seventh-day Adventist business owners, professionals,
        and students supporting Christ-centered enterprise in the Cayman Islands.
        Submit your application below — an admin will review and activate your
        access, then you can complete your profile, list your business, and
        register for the expo.
      </p>

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
