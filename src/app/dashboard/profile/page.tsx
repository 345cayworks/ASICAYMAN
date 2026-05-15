import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Profile" };

async function updateProfile(formData: FormData) {
  "use server";
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const churchAffiliation = String(formData.get("churchAffiliation") ?? "").trim();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      memberProfile: {
        upsert: {
          create: { bio: bio || null, churchAffiliation: churchAffiliation || null },
          update: { bio: bio || null, churchAffiliation: churchAffiliation || null },
        },
      },
    },
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
}

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { memberProfile: true },
  });
  if (!user) return null;

  return (
    <div className="grid gap-6">
      <header>
        <p className="section-eyebrow">Profile</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Edit your profile</h1>
        <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
          Keep your details up to date so we can reach you with announcements and event details.
        </p>
      </header>

      <form action={updateProfile} className="card p-7 grid gap-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <label>
            <span className="field-label">Full name</span>
            <input name="name" defaultValue={user.name ?? ""} className="field-input" required />
          </label>
          <label>
            <span className="field-label">Email</span>
            <input value={user.email} disabled className="field-input opacity-60 cursor-not-allowed" />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label>
            <span className="field-label">Phone</span>
            <input name="phone" defaultValue={user.phone ?? ""} className="field-input" />
          </label>
          <label>
            <span className="field-label">WhatsApp</span>
            <input name="whatsapp" defaultValue={user.whatsapp ?? ""} className="field-input" />
          </label>
        </div>

        <label>
          <span className="field-label">Church affiliation</span>
          <input
            name="churchAffiliation"
            defaultValue={user.memberProfile?.churchAffiliation ?? ""}
            placeholder="e.g. Savannah SDA Church"
            className="field-input"
          />
        </label>

        <label>
          <span className="field-label">Short bio</span>
          <textarea
            name="bio"
            defaultValue={user.memberProfile?.bio ?? ""}
            rows={5}
            className="field-input min-h-[120px]"
            placeholder="A sentence or two about your work, ministry, or testimony."
          />
        </label>

        <div className="grid grid-cols-2 gap-3 text-sm text-[color:var(--color-navy-700)]">
          <div>
            <p className="field-label">Membership type</p>
            <p>{user.memberProfile?.membershipType ?? "—"}</p>
          </div>
          <div>
            <p className="field-label">Membership status</p>
            <p>{user.memberProfile?.membershipStatus ?? "—"}</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  );
}
