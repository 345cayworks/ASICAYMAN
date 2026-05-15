import { Mail, MessageCircle, MapPin } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { SITE } from "@/lib/utils";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 lg:px-8 pt-16 md:pt-24 pb-12">
        <p className="section-eyebrow">Contact</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-display tracking-tight max-w-3xl">
          Let's talk.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[color:var(--color-navy-700)] leading-relaxed">
          Questions about membership, the expo, partnerships, or how to get involved with ASI Cayman?
          Send a message — we'd love to hear from you.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 lg:px-8 pb-24 grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 card p-7 md:p-10">
          <ContactForm />
        </div>

        <aside className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <h3 className="font-display text-lg">Direct contact</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 text-[color:var(--color-gold-600)]" />
                <div>
                  <p className="text-[color:var(--color-navy-700)]">Email</p>
                  <a href={`mailto:${SITE.email}`} className="text-[color:var(--color-navy-900)] hover:underline">{SITE.email}</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle size={16} className="mt-0.5 text-[color:var(--color-gold-600)]" />
                <div>
                  <p className="text-[color:var(--color-navy-700)]">WhatsApp</p>
                  <a href={SITE.whatsappLink} className="text-[color:var(--color-navy-900)] hover:underline">{SITE.whatsapp}</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-[color:var(--color-gold-600)]" />
                <div>
                  <p className="text-[color:var(--color-navy-700)]">Region</p>
                  <p className="text-[color:var(--color-navy-900)]">Grand Cayman, Cayman Islands</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="card p-6 bg-[color:var(--color-cream)]/60">
            <p className="section-eyebrow">For exhibitors</p>
            <p className="mt-3 text-sm text-[color:var(--color-navy-700)] leading-relaxed">
              For Expo 2026 booth questions, please use the <a href="/expo/register" className="underline underline-offset-4">registration form</a> — it captures the details we need.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
