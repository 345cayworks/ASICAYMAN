import { prisma } from "@/lib/db";
import { publishAnnouncement, archiveAnnouncement } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <header>
        <p className="section-eyebrow">Admin</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Announcements</h1>
        <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">Create posts that reach members and exhibitors.</p>
      </header>

      <form action={publishAnnouncement} className="card p-6 grid gap-4">
        <p className="section-eyebrow">New announcement</p>
        <input name="title" placeholder="Title" required className="field-input" />
        <textarea name="body" placeholder="Write your announcement…" rows={5} required className="field-input min-h-[140px]" />
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Audience:&nbsp;
            <select name="audience" defaultValue="ALL" className="field-input inline-block w-auto text-sm py-1.5">
              <option value="ALL">Everyone</option>
              <option value="MEMBERS">Members</option>
              <option value="EXHIBITORS">Exhibitors</option>
              <option value="ADMINS">Admins only</option>
            </select>
          </label>
          <div className="flex gap-2 ml-auto">
            <button name="publish" value="false" className="btn btn-outline text-sm">Save draft</button>
            <button name="publish" value="true" className="btn btn-primary text-sm">Publish</button>
          </div>
        </div>
      </form>

      <div className="grid gap-3">
        {announcements.length === 0 ? (
          <p className="text-sm text-[color:var(--color-navy-600)]">No announcements yet.</p>
        ) : (
          announcements.map((a) => (
            <article key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg">{a.title}</h3>
                    <span className={`badge ${a.status === "PUBLISHED" ? "badge-approved" : "badge-pending"}`}>{a.status}</span>
                    <span className="badge badge-paid">{a.audience}</span>
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--color-navy-600)]">
                    {a.publishedAt ? `Published ${a.publishedAt.toLocaleString()}` : `Created ${a.createdAt.toLocaleString()}`}
                  </p>
                  <p className="mt-3 text-sm text-[color:var(--color-navy-700)] whitespace-pre-wrap">{a.body}</p>
                </div>
                <form action={archiveAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="btn btn-outline text-xs">Archive</button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
