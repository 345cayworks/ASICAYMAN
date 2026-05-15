import Link from "next/link";
import { SignInForm } from "@/components/forms/signin-form";

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-md px-5 pt-24 pb-24">
      <h1 className="font-display text-3xl tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
        Sign in to your ASI Cayman account.
      </p>

      <div className="mt-8 card p-7">
        <SignInForm callbackUrl={params.callbackUrl} initialError={params.error} />
      </div>

      <p className="mt-6 text-sm text-center text-[color:var(--color-navy-700)]">
        New to ASI Cayman?{" "}
        <Link href="/auth/signup" className="text-[color:var(--color-navy-900)] underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </section>
  );
}
