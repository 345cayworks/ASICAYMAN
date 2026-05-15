import Link from "next/link";
import { prisma } from "@/lib/db";
import { approveListing, rejectListing, toggleFeatured } from "@/app/admin/actions";
import { CheckCircle2, X, Star } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Business listings" };

interface Props { searchParams: Promise<{ status?: string }> }

export default async function AdminListingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const listings = await prisma.businessListing.findMany({
    where: params.status ? { status: params.status as "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" } : {},
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  });

  return (
    <div className="grid gap-6">
      <header>
        <p className="section-eyebrow">Admin</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Business listings</h1>
        <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">{listings.length} listings.</p>
      </header>

      <div className="flex flex-wrap gap-2 text-xs">
        <Filter active={!params.status} href="/admin/listings">All</Filter>
        <Filter active={params.status === "PENDING"} href="/admin/listings?status=PENDING">Pending</Filter>
        <Filter active={params.status === "APPROVED"} href="/admin/listings?status=APPROVED">Approved</Filter>
        <Filter active={params.status === "REJECTED"} href="/admin/listings?status=REJECTED">Rejected</Filter>
        <Filter active={params.status === "HIDDEN"} href="/admin/listings?status=HIDDEN">Hidden</Filter>
      </div>

      <div className="grid gap-4">
        {listings.map((l) => (
          <article key={l.id} className="card p-5 grid md:grid-cols-[1fr_auto] gap-5 items-start">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-display text-xl">{l.businessName}</h3>
                <span className={`badge ${l.status === "APPROVED" ? "badge-approved" : l.status === "REJECTED" ? "badge-rejected" : "badge-pending"}`}>{l.status}</span>
                {l.isFeatured && <span className="badge badge-pending"><Star size={10} /> Featured</span>}
              </div>
              <p className="text-xs text-[color:var(--color-navy-600)]">{l.category} · owner: {l.owner.email}</p>
              <p className="mt-3 text-sm text-[color:var(--color-navy-700)] leading-relaxed">{l.description}</p>
              {l.specialOffer && <p className="mt-2 text-xs"><strong>Offer:</strong> {l.specialOffer}</p>}
              <p className="mt-2 text-xs text-[color:var(--color-navy-600)]">
                {l.email && <>📧 {l.email} · </>}{l.phone && <>📞 {l.phone} · </>}{l.website && <a className="underline" href={l.website} target="_blank" rel="noreferrer">{l.website}</a>}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:min-w-[160px]">
              {l.status !== "APPROVED" && (
                <form action={approveListing}>
                  <input type="hidden" name="listingId" value={l.id} />
                  <button className="btn btn-primary text-xs py-1.5 px-3 w-full"><CheckCircle2 size={12} /> Approve</button>
                </form>
              )}
              {l.status !== "REJECTED" && (
                <form action={rejectListing}>
                  <input type="hidden" name="listingId" value={l.id} />
                  <button className="btn btn-outline text-xs py-1.5 px-3 w-full"><X size={12} /> Reject</button>
                </form>
              )}
              <form action={toggleFeatured}>
                <input type="hidden" name="listingId" value={l.id} />
                <button className="btn btn-outline text-xs py-1.5 px-3 w-full">
                  <Star size={12} /> {l.isFeatured ? "Unfeature" : "Feature"}
                </button>
              </form>
            </div>
          </article>
        ))}
        {listings.length === 0 && (
          <div className="card p-12 text-center text-[color:var(--color-navy-600)]">No listings match.</div>
        )}
      </div>
    </div>
  );
}

function Filter({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`px-3 py-1.5 rounded-full border transition-colors ${active ? "bg-[color:var(--color-navy-900)] text-white border-[color:var(--color-navy-900)]" : "bg-white text-[color:var(--color-navy-700)] border-[color:var(--color-navy-100)] hover:border-[color:var(--color-navy-300)]"}`}>
      {children}
    </Link>
  );
}
