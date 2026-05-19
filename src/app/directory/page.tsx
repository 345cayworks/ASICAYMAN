import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { SectionHeader } from "@/components/site/section-header";
import { NativeAd } from "@/components/ads/variants";
import { AD_PLACEMENTS } from "@/components/ads/placements";

export const metadata = { title: "Business Directory" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function DirectoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim();
  const category = params.category?.trim();

  const listings = await prisma.businessListing.findMany({
    where: {
      status: "APPROVED",
      isPublic: true,
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { businessName: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { businessName: "asc" }],
    take: 60,
  });

  const categories = await prisma.businessListing.findMany({
    where: { status: "APPROVED", isPublic: true },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 lg:px-8 pt-16 md:pt-20 pb-10">
        <p className="section-eyebrow">Directory</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-display tracking-tight">
          Adventist-owned businesses in the Cayman Islands.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[color:var(--color-navy-700)] leading-relaxed">
          Discover trusted businesses, professionals, and services run by members of our community.
        </p>

        <form className="mt-8 flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-navy-500)]" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search businesses, services, products…"
              className="field-input pl-10"
            />
          </div>
          <select name="category" defaultValue={category ?? ""} className="field-input max-w-[180px]">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>{c.category}</option>
            ))}
          </select>
          <button className="btn btn-primary">Search</button>
        </form>
      </section>

      <section className="mx-auto max-w-6xl px-5 lg:px-8 pb-24">
        <NativeAd
          placement={AD_PLACEMENTS.directoryInline}
          userRole="GUEST"
          className="mb-6"
        />
        {listings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => (
              <article key={l.id} className="card p-6 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-[color:var(--color-gold-200)] to-[color:var(--color-gold-400)] flex items-center justify-center font-display text-lg text-[color:var(--color-navy-900)]">
                    {l.businessName[0]?.toUpperCase() ?? "·"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg leading-tight truncate">{l.businessName}</h3>
                    <p className="text-xs text-[color:var(--color-navy-600)]">{l.category}</p>
                  </div>
                  {l.isFeatured && <span className="badge badge-pending ml-auto">Featured</span>}
                </div>
                <p className="mt-4 text-sm text-[color:var(--color-navy-700)] leading-relaxed line-clamp-3">
                  {l.description}
                </p>
                {l.specialOffer && (
                  <p className="mt-3 text-xs px-3 py-2 rounded-md bg-[color:var(--color-gold-50)] text-[color:var(--color-gold-700)] border border-[color:var(--color-gold-200)]">
                    🎁 {l.specialOffer}
                  </p>
                )}
                <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                  {l.website ? (
                    <a href={l.website} target="_blank" rel="noreferrer" className="text-[color:var(--color-navy-800)] hover:text-[color:var(--color-gold-600)] inline-flex items-center gap-1">
                      Visit site <ArrowRight size={14} />
                    </a>
                  ) : <span />}
                  {l.email && (
                    <a href={`mailto:${l.email}`} className="text-xs text-[color:var(--color-navy-600)] hover:underline">{l.email}</a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 md:p-16 text-center">
      <div className="size-14 mx-auto rounded-full bg-[color:var(--color-cream)] flex items-center justify-center">
        <Search size={20} className="text-[color:var(--color-gold-700)]" />
      </div>
      <h3 className="mt-5 font-display text-2xl">The directory is just getting started.</h3>
      <p className="mt-3 max-w-md mx-auto text-[color:var(--color-navy-700)]">
        Be one of the first Adventist-owned businesses listed. Members can submit a listing through their dashboard.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/membership" className="btn btn-gold">Become a member</Link>
        <Link href="/contact" className="btn btn-outline">Get in touch</Link>
      </div>
    </div>
  );
}
