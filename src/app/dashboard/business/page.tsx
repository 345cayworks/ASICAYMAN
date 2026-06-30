import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { businessListingSchema } from "@/lib/validators";

export const metadata = { title: "My business listing" };

async function upsertListing(formData: FormData): Promise<void> {
  "use server";
  const user = await requireUser();

  const raw = {
    businessName: String(formData.get("businessName") ?? ""),
    category: String(formData.get("category") ?? ""),
    description: String(formData.get("description") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    website: String(formData.get("website") ?? ""),
    specialOffer: String(formData.get("specialOffer") ?? ""),
    socialLinks: {
      facebook: String(formData.get("facebook") ?? ""),
      instagram: String(formData.get("instagram") ?? ""),
      linkedin: String(formData.get("linkedin") ?? ""),
    },
  };

  const parsed = businessListingSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    return;
  }
  const data = parsed.data;

  const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

  const existing = await prisma.businessListing.findFirst({ where: { ownerId: user.id } });

  if (existing) {
    await prisma.businessListing.update({
      where: { id: existing.id },
      data: {
        businessName: data.businessName,
        category: data.category,
        description: data.description,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        specialOffer: data.specialOffer || null,
        socialLinks: data.socialLinks ?? undefined,
        status: existing.status === "APPROVED" ? "PENDING" : existing.status,
      },
    });
  } else {
    await prisma.businessListing.create({
      data: {
        ownerId: user.id,
        businessName: data.businessName,
        slug: `${slug}-${Date.now().toString(36)}`,
        category: data.category,
        description: data.description,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        specialOffer: data.specialOffer || null,
        socialLinks: data.socialLinks ?? undefined,
        status: "PENDING",
      },
    });
  }

  revalidatePath("/dashboard/business");
  revalidatePath("/directory");
}

const CATEGORIES = [
  "Health & Wellness", "Financial Services", "Professional Services",
  "Construction & Trades", "Technology", "Food & Hospitality", "Retail",
  "Education", "Media & Creative", "Real Estate", "Automotive",
  "Beauty & Personal Care", "Other",
];

export default async function BusinessListingPage() {
  const sessionUser = await requireUser();
  const listing = await prisma.businessListing.findFirst({ where: { ownerId: sessionUser.id } });
  const social = (listing?.socialLinks as { facebook?: string; instagram?: string; linkedin?: string } | null) ?? {};

  return (
    <div className="grid gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">My business</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">
            {listing ? "Edit your listing" : "Add your business"}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
            Approved listings appear in the public Adventist Business Community directory. Edits return your listing to &ldquo;Pending&rdquo; for review.
          </p>
        </div>
        {listing && <span className={`badge badge-${listing.status === "APPROVED" ? "approved" : listing.status === "REJECTED" ? "rejected" : "pending"}`}>{listing.status}</span>}
      </header>

      <form action={upsertListing} className="card p-7 grid gap-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <label>
            <span className="field-label">Business name</span>
            <input name="businessName" defaultValue={listing?.businessName ?? ""} required className="field-input" />
          </label>
          <label>
            <span className="field-label">Category</span>
            <select name="category" defaultValue={listing?.category ?? ""} required className="field-input">
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>

        <label>
          <span className="field-label">Description</span>
          <textarea
            name="description"
            rows={5}
            required minLength={20}
            defaultValue={listing?.description ?? ""}
            className="field-input min-h-[140px]"
            placeholder="A few sentences about your business and what you offer…"
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <label>
            <span className="field-label">Phone</span>
            <input name="phone" defaultValue={listing?.phone ?? ""} className="field-input" />
          </label>
          <label>
            <span className="field-label">Email</span>
            <input name="email" type="email" defaultValue={listing?.email ?? ""} className="field-input" />
          </label>
        </div>

        <label>
          <span className="field-label">Website</span>
          <input name="website" type="url" defaultValue={listing?.website ?? ""} placeholder="https://…" className="field-input" />
        </label>

        <label>
          <span className="field-label">Special offer (optional)</span>
          <input name="specialOffer" defaultValue={listing?.specialOffer ?? ""} maxLength={500} className="field-input" placeholder="e.g. 10% off for community members" />
        </label>

        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="field-label sm:col-span-3">Social links</legend>
          <input name="facebook" defaultValue={social.facebook ?? ""} placeholder="Facebook URL" className="field-input" />
          <input name="instagram" defaultValue={social.instagram ?? ""} placeholder="Instagram URL" className="field-input" />
          <input name="linkedin" defaultValue={social.linkedin ?? ""} placeholder="LinkedIn URL" className="field-input" />
        </fieldset>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            {listing ? "Save changes" : "Submit for review"}
          </button>
        </div>
      </form>
    </div>
  );
}
