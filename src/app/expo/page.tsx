import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/site/section-header";
import { SITE } from "@/lib/utils";
import { AdBanner } from "@/components/ads/variants";
import { AD_PLACEMENTS } from "@/components/ads/placements";

export const metadata = { title: "Business & Career Expo 2026" };

const attractions = [
  "Free admission",
  "Local Adventist-owned businesses",
  "Discounts, samples & giveaways",
  "Prizes",
  "Free health screenings",
  "Massage therapy",
  "Career guidance for youth & students",
  "Business, healthcare & trades booths",
];

const exhibitorBenefits = [
  "Reserved booth at The Lion Center",
  "Inclusion in our social media advertising",
  "Submit a 2-minute promotional video aired by media partners",
  "Opportunity to join in-studio promotional interviews",
];

const faqs = [
  {
    q: "Who is the expo for?",
    a: "Everyone! Public admission is free. It's family friendly and designed for the church membership and the wider Caymanian community.",
  },
  {
    q: "Do I need to register to attend?",
    a: "No — only exhibitors need to register. Members of the public can simply show up on June 28 at 2:00 PM.",
  },
  {
    q: "Is the early-bird rate only for ASI members?",
    a: "No. Anyone who pays on or before May 31, 2026 pays the $100 rate. After that, non-members pay $150 and current ASI members continue to pay $100.",
  },
  {
    q: "How do I pay?",
    a: "Payment is made at RBC to the ASI Cayman Cheque Account. Upload your receipt through the portal or email/WhatsApp it to us. An admin will verify and confirm.",
  },
  {
    q: "Can I submit a promotional video?",
    a: "Yes. When you register, indicate you'd like to submit a 2-minute promo video and our media partners will get in touch with submission details.",
  },
];

export default function ExpoPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[color:var(--color-navy-950)] text-white">
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, var(--color-gold-500) 0%, transparent 35%), radial-gradient(circle at 80% 80%, var(--color-teal-500) 0%, transparent 40%)",
        }} />
        <div className="relative mx-auto max-w-6xl px-5 lg:px-8 py-20 md:py-28">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-gold-300)]">June 28, 2026 · Grand Cayman</p>
          <h1 className="mt-4 text-4xl md:text-6xl font-display tracking-tight max-w-3xl leading-[1.05]">
            ASI Cayman Business <span className="italic text-[color:var(--color-gold-300)]">& Career Expo</span> 2026
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85 leading-relaxed">
            A celebration of Adventist-owned businesses, professionals, and career paths in the
            Cayman Islands. Free for the public.
          </p>

          <dl className="mt-10 grid sm:grid-cols-3 gap-5 max-w-3xl">
            <Stat icon={<Calendar size={16} />} label="Date" value={SITE.expo.date} />
            <Stat icon={<Clock size={16} />} label="Time" value={SITE.expo.time} />
            <Stat icon={<MapPin size={16} />} label="Venue" value={SITE.expo.location} />
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/expo/register" className="btn btn-gold">
              Register a booth <ArrowRight size={16} />
            </Link>
            <Link href="#exhibitor-info" className="btn btn-outline border-white/30 text-white hover:bg-white hover:text-[color:var(--color-navy-900)]">
              Exhibitor details
            </Link>
          </div>
        </div>
      </section>

      {/* Public attractions */}
      <section className="mx-auto max-w-6xl px-5 lg:px-8 py-20">
        <SectionHeader
          eyebrow="For the public"
          title="What to expect at the expo."
          subtitle="An afternoon of discovery, health, career, and community — all under one roof."
        />
        <ul className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {attractions.map((a) => (
            <li key={a} className="card p-5 flex items-start gap-3 text-sm">
              <CheckCircle2 size={18} className="text-[color:var(--color-teal-500)] shrink-0 mt-0.5" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-5 lg:px-8 pb-4">
        <AdBanner placement={AD_PLACEMENTS.expoBanner} userRole="GUEST" />
      </section>

      {/* Exhibitor info */}
      <section id="exhibitor-info" className="bg-[color:var(--color-cream)]/50 border-y border-[color:var(--color-navy-100)]">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-20 grid lg:grid-cols-2 gap-12">
          <div>
            <p className="section-eyebrow">For exhibitors</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Showcase your business.</h2>
            <p className="mt-5 text-[color:var(--color-navy-700)] leading-relaxed">
              Register a booth to put your products and services in front of the church
              membership and wider community. Connect with future clients, partners, and
              employees.
            </p>
            <ul className="mt-7 space-y-3">
              {exhibitorBenefits.map((b) => (
                <li key={b} className="flex gap-3 text-[color:var(--color-navy-800)]">
                  <CheckCircle2 size={20} className="text-[color:var(--color-gold-600)] shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-8">
            <p className="section-eyebrow">Pricing</p>
            <div className="mt-3 grid sm:grid-cols-2 gap-4">
              <PriceCard
                label="ASI member"
                price="$100"
                note="Active members only"
                highlight
              />
              <PriceCard
                label="Early-bird"
                price="$100"
                note={`Paid on or before ${SITE.expo.earlyBirdDeadline}`}
              />
              <PriceCard
                label="Regular"
                price="$150"
                note="After May 31, 2026"
                className="sm:col-span-2"
              />
            </div>

            <div className="mt-8">
              <p className="section-eyebrow">Payment</p>
              <p className="mt-2 text-sm text-[color:var(--color-navy-700)] leading-relaxed">
                Pay at RBC to the <strong>{SITE.rbcAccount.name}</strong>,
                account <strong>#{SITE.rbcAccount.number}</strong>. Upload your receipt through the
                portal after registration, or send it to{" "}
                <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">{SITE.email}</a> /
                WhatsApp <a href={SITE.whatsappLink} className="underline underline-offset-4">{SITE.whatsapp}</a>.
              </p>
            </div>

            <Link href="/expo/register" className="mt-8 btn btn-gold w-full">
              Register for the expo <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-5 lg:px-8 py-20">
        <SectionHeader eyebrow="FAQ" title="Common questions." align="center" />
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="card p-5 group">
              <summary className="cursor-pointer list-none flex justify-between items-center font-medium text-[color:var(--color-navy-900)]">
                {f.q}
                <span className="text-[color:var(--color-gold-600)] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-[color:var(--color-navy-700)] leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border-l-2 border-[color:var(--color-gold-400)] pl-4">
      <div className="flex items-center gap-2 text-[color:var(--color-gold-300)] text-xs uppercase tracking-wider">
        {icon} {label}
      </div>
      <p className="mt-1 text-white font-display text-lg">{value}</p>
    </div>
  );
}

function PriceCard({
  label, price, note, highlight, className,
}: { label: string; price: string; note: string; highlight?: boolean; className?: string }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-[color:var(--color-gold-500)] bg-[color:var(--color-gold-50)]" : "border-[color:var(--color-navy-100)] bg-white"} ${className ?? ""}`}>
      <p className="text-xs uppercase tracking-wider text-[color:var(--color-navy-600)]">{label}</p>
      <p className="mt-1 font-display text-2xl text-[color:var(--color-navy-900)]">{price}</p>
      <p className="mt-1 text-xs text-[color:var(--color-navy-700)]">{note}</p>
    </div>
  );
}
