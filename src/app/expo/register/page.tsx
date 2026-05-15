import { auth } from "@/lib/auth";
import { ExpoRegistrationForm } from "@/components/forms/expo-registration-form";
import { SITE } from "@/lib/utils";

export const metadata = { title: "Register for Expo 2026" };

export default async function ExpoRegisterPage() {
  const session = await auth();

  return (
    <>
      <section className="mx-auto max-w-3xl px-5 lg:px-8 pt-16 md:pt-20 pb-8">
        <p className="section-eyebrow">Expo 2026</p>
        <h1 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
          Register your booth
        </h1>
        <p className="mt-4 text-[color:var(--color-navy-700)] leading-relaxed">
          {SITE.expo.date}, {SITE.expo.time} · {SITE.expo.location}. Pricing is calculated
          automatically based on your ASI membership status and the date.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-5 lg:px-8 pb-24">
        <ExpoRegistrationForm defaultEmail={session?.user?.email ?? undefined} />
      </section>
    </>
  );
}
