import Link from "next/link";
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { textLlmConfigured } from "@/lib/blog/generate-runner";
import { createPost, generateWithAI } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog" };

interface Props {
  searchParams: Promise<{ ok?: string; error?: string }>;
}

export default async function AdminBlogPage({ searchParams }: Props) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const aiEnabled = textLlmConfigured();

  const posts = await prisma.blogPost.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      source: true,
      isPublished: true,
      publishedAt: true,
      scheduledFor: true,
      updatedAt: true,
    },
    take: 100,
  });

  return (
    <div className="grid gap-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="section-eyebrow">Admin</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Blog</h1>
          <p className="mt-2 text-sm text-[color:var(--color-navy-700)]">
            Write posts in Markdown. New posts start as drafts.
          </p>
        </div>
        {aiEnabled && (
          <form action={generateWithAI}>
            <button className="btn btn-outline text-sm">
              <Sparkles size={15} /> Generate with AI
            </button>
          </form>
        )}
      </header>

      {ok === "deleted" && (
        <p className="card p-3 text-sm text-green-800 bg-green-50 border-green-200">Post deleted.</p>
      )}
      {error && (
        <p className="card p-3 text-sm text-red-700 bg-red-50 border-red-200">{error}</p>
      )}

      <form action={createPost} className="card p-6 grid gap-4">
        <p className="section-eyebrow">New post</p>
        <input name="title" placeholder="Title" required className="field-input" />
        <input
          name="slug"
          placeholder="Slug (optional — generated from title)"
          className="field-input"
        />
        <input name="summary" placeholder="Summary (optional)" className="field-input" />
        <textarea
          name="body"
          placeholder="Body (Markdown)…"
          rows={6}
          className="field-input min-h-[160px] font-mono text-sm"
        />
        <input name="tags" placeholder="Tags (comma-separated)" className="field-input" />
        <div className="flex justify-end">
          <button className="btn btn-primary text-sm">Create draft</button>
        </div>
      </form>

      <div className="grid gap-2">
        {posts.length === 0 ? (
          <p className="text-sm text-[color:var(--color-navy-600)]">No posts yet.</p>
        ) : (
          posts.map((p) => (
            <Link
              key={p.id}
              href={`/admin/blog/${p.id}`}
              className="card p-4 flex items-center justify-between gap-3 hover:border-[color:var(--color-navy-300)] transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-base truncate">{p.title}</h3>
                  <span className={`badge ${p.isPublished ? "badge-approved" : "badge-pending"}`}>
                    {p.isPublished ? "Published" : p.scheduledFor ? "Scheduled" : "Draft"}
                  </span>
                  {p.source === "AI" && <span className="badge badge-paid">AI</span>}
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-navy-600)] truncate">
                  /{p.slug} · updated {p.updatedAt.toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs text-[color:var(--color-navy-500)] shrink-0">Edit →</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
