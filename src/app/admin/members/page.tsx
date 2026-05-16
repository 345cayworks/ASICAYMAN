import Link from "next/link";
import { prisma } from "@/lib/db";
import { approveMember, rejectMember, changeRole } from "@/app/admin/actions";
import { getMembershipCategory } from "@/lib/membership";
import { CheckCircle2, X } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Members" };

interface Props { searchParams: Promise<{ status?: string; role?: string }> }

export default async function AdminMembersPage({ searchParams }: Props) {
  const params = await searchParams;
  const members = await prisma.user.findMany({
    where: {
      ...(params.status ? { status: params.status as "PENDING" | "ACTIVE" | "SUSPENDED" | "ARCHIVED" } : {}),
      ...(params.role ? { role: params.role as "MEMBER" | "EXHIBITOR" | "ADMIN" | "SUPERADMIN" } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { memberProfile: true },
  });

  return (
    <div className="grid gap-6">
      <header>
        <p className="section-eyebrow">Admin</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Members</h1>
        <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">{members.length} accounts.</p>
      </header>

      <div className="flex flex-wrap gap-2 text-xs">
        <Filter active={!params.status} href="/admin/members">All</Filter>
        <Filter active={params.status === "PENDING"} href="/admin/members?status=PENDING">Pending</Filter>
        <Filter active={params.status === "ACTIVE"} href="/admin/members?status=ACTIVE">Active</Filter>
        <Filter active={params.status === "SUSPENDED"} href="/admin/members?status=SUSPENDED">Suspended</Filter>
        <span className="w-px self-stretch bg-[color:var(--color-navy-100)] mx-1" />
        <Filter active={params.role === "ADMIN"} href="/admin/members?role=ADMIN">Admins</Filter>
        <Filter active={params.role === "MEMBER"} href="/admin/members?role=MEMBER">Members</Filter>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-[color:var(--color-navy-600)] border-b border-[color:var(--color-navy-100)]">
            <tr>
              <th className="text-left px-5 py-3">Name / Email</th>
              <th className="text-left px-3 py-3">Joined</th>
              <th className="text-left px-3 py-3">Role</th>
              <th className="text-left px-3 py-3">Status</th>
              <th className="text-left px-3 py-3">Membership</th>
              <th className="text-left px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-navy-100)]">
            {members.map((m) => (
              <tr key={m.id} className="align-top">
                <td className="px-5 py-4">
                  <p className="font-medium">{m.name ?? "—"}</p>
                  <p className="text-xs text-[color:var(--color-navy-600)]">{m.email}</p>
                  {m.phone && (
                    <p className="text-xs text-[color:var(--color-navy-600)]">{m.phone}</p>
                  )}
                  {m.memberProfile?.businessOrProfession && (
                    <p className="mt-1 text-xs text-[color:var(--color-navy-700)]">
                      <span className="text-[color:var(--color-navy-500)]">Business/Profession:</span>{" "}
                      {m.memberProfile.businessOrProfession}
                    </p>
                  )}
                  {m.memberProfile?.churchAffiliation && (
                    <p className="text-xs text-[color:var(--color-navy-700)]">
                      <span className="text-[color:var(--color-navy-500)]">Church:</span>{" "}
                      {m.memberProfile.churchAffiliation}
                    </p>
                  )}
                  {m.memberProfile?.membershipCategory && (
                    <p className="mt-1 text-xs">
                      {(() => {
                        const c = getMembershipCategory(m.memberProfile.membershipCategory);
                        return c ? `${c.label} · CI$${c.feeKyd}` : m.memberProfile.membershipCategory;
                      })()}
                    </p>
                  )}
                </td>
                <td className="px-3 py-4 text-xs text-[color:var(--color-navy-600)]">{m.createdAt.toLocaleDateString()}</td>
                <td className="px-3 py-4">
                  <form action={changeRole} className="flex gap-1">
                    <input type="hidden" name="userId" value={m.id} />
                    <select name="role" defaultValue={m.role} className="field-input text-xs py-1">
                      <option value="MEMBER">Member</option>
                      <option value="EXHIBITOR">Exhibitor</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPERADMIN">Superadmin</option>
                    </select>
                    <button className="btn btn-outline text-xs px-2 py-1">Save</button>
                  </form>
                </td>
                <td className="px-3 py-4">
                  <span className={`badge ${m.status === "ACTIVE" ? "badge-approved" : m.status === "PENDING" ? "badge-pending" : "badge-rejected"}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-3 py-4 text-xs">
                  {m.memberProfile?.membershipType ?? "—"} · {m.memberProfile?.membershipStatus ?? "—"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {m.status !== "ACTIVE" && (
                      <form action={approveMember}>
                        <input type="hidden" name="userId" value={m.id} />
                        <button className="btn btn-primary text-xs py-1.5 px-3 w-full"><CheckCircle2 size={12} /> Approve</button>
                      </form>
                    )}
                    {m.status !== "SUSPENDED" && (
                      <form action={rejectMember}>
                        <input type="hidden" name="userId" value={m.id} />
                        <button className="btn btn-outline text-xs py-1.5 px-3 w-full"><X size={12} /> Suspend</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-[color:var(--color-navy-600)]">No members match.</td></tr>
            )}
          </tbody>
        </table>
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
