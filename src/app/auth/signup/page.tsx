import Link from "next/link";
import { SignUpForm } from "@/components/forms/signup-form";

export const metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <section className="mx-auto max-w-md px-5 pt-20 pb-24">
      <h1 className="font-display text-3xl tracking-tight">Become a member</h1>
      <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
        Create a marketplace account. We&apos;ll review your application and activate access.
      </p>

      <div className="mt-8 card p-7">
        <SignUpForm />
      </div>

      <p className="mt-6 text-sm text-center text-[color:var(--color-navy-700)]">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-[color:var(--color-navy-900)] underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </section>
  );
}
