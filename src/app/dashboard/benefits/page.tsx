import { ExternalLink, Gift } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { PageWithRightColumn } from "@/components/ads/page-with-right-column";

export const metadata = { title: "Member benefits" };

export default async function BenefitsPage() {
  const user = await requireUser();
  const benefits = await prisma.benefit.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <PageWithRightColumn fallbackVariant="member" userRole={user.role}>
      <header>
        <p className="section-eyebrow">Member benefits</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Your membership in action</h1>
        <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
          What ASI Cayman membership unlocks. New benefits are added throughout the year.
        </p>
      </header>

      {benefits.length === 0 ? (
        <div className="card p-12 text-center">
          <Gift size={28} className="mx-auto text-[color:var(--color-gold-600)]" />
          <p className="mt-4 text-[color:var(--color-navy-700)]">Benefits will appear here as they're added.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {benefits.map((b) => (
            <article key={b.id} className="card p-6">
              <div className="size-9 rounded-full bg-[color:var(--color-gold-100)] flex items-center justify-center text-[color:var(--color-gold-700)]">
                <Gift size={16} />
              </div>
              <h3 className="mt-4 font-display text-lg">{b.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--color-navy-700)] leading-relaxed">{b.description}</p>
              {b.url && (
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-navy-900)] hover:text-[color:var(--color-gold-600)]"
                >
                  Learn more <ExternalLink size={14} />
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </PageWithRightColumn>
  );
}
