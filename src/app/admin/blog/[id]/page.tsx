import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import {
  updatePost,
  publishPost,
  unpublishPost,
  schedulePost,
  deletePost,
  uploadCover,
  removeCover,
} from "../actions";
import { InlineImageUploader } from "./inline-image-uploader";
import { GenerateImagesButton } from "./generate-images-button";
import { imageApiConfigured } from "@/lib/blog/images";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit post" };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}

// Format a Date for a <input type="datetime-local"> value (local time).
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditBlogPostPage({ params, searchParams }: Props) {
  const user = await requireAdmin();
  const { id } = await params;
  const { ok, error } = await searchParams;
  const isSuper = user.role === "SUPERADMIN";

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  const coverSrc = post.coverImageKey ? `/api/blog/images/${post.coverImageKey}` : null;

  return (
    <div className="grid gap-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/admin/blog" className="text-xs text-[color:var(--color-navy-600)]">
            ← All posts
          </Link>
          <h1 className="mt-1 font-display text-2xl tracking-tight">Edit post</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`badge ${post.isPublished ? "badge-approved" : "badge-pending"}`}>
              {post.isPublished ? "Published" : post.scheduledFor ? "Scheduled" : "Draft"}
            </span>
            {post.source === "AI" && <span className="badge badge-paid">AI</span>}
          </div>
        </div>
        <Link href={`/blog/${post.slug}`} className="btn btn-outline text-sm" target="_blank">
          View →
        </Link>
      </header>

      {ok && <p className="card p-3 text-sm text-green-800 bg-green-50 border-green-200">Saved ({ok}).</p>}
      {error && <p className="card p-3 text-sm text-red-700 bg-red-50 border-red-200">{error}</p>}

      {/* Content */}
      <form action={updatePost} className="card p-6 grid gap-4">
        <input type="hidden" name="id" value={post.id} />
        <label className="grid gap-1 text-sm">
          Title
          <input name="title" defaultValue={post.title} required className="field-input" />
        </label>
        <label className="grid gap-1 text-sm">
          Slug
          <input name="slug" defaultValue={post.slug} className="field-input" />
        </label>
        <label className="grid gap-1 text-sm">
          Summary
          <input name="summary" defaultValue={post.summary ?? ""} className="field-input" />
        </label>
        <label className="grid gap-1 text-sm">
          Body (Markdown)
          <textarea
            name="body"
            defaultValue={post.body}
            rows={16}
            className="field-input min-h-[320px] font-mono text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Tags (comma-separated)
          <input name="tags" defaultValue={post.tags.join(", ")} className="field-input" />
        </label>
        <label className="grid gap-1 text-sm">
          SEO description
          <input name="seoDescription" defaultValue={post.seoDescription ?? ""} className="field-input" />
        </label>
        <div className="flex justify-end">
          <button className="btn btn-primary text-sm">Save</button>
        </div>
      </form>

      {/* Cover image */}
      <section className="card p-6 grid gap-4">
        <p className="section-eyebrow">Cover image</p>
        {coverSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} alt="Cover" className="w-full max-w-md rounded-lg border border-[color:var(--color-navy-100)]" />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <form action={uploadCover} className="flex items-center gap-2">
            <input type="hidden" name="id" value={post.id} />
            <input type="file" name="file" accept="image/*" required className="text-sm" />
            <button className="btn btn-outline text-sm">{coverSrc ? "Replace" : "Upload"}</button>
          </form>
          {coverSrc && (
            <form action={removeCover}>
              <input type="hidden" name="id" value={post.id} />
              <button className="btn btn-outline text-sm">Remove</button>
            </form>
          )}
        </div>
        <InlineImageUploader />

        {isSuper && imageApiConfigured() && (
          <div className="pt-4 border-t border-[color:var(--color-navy-100)]">
            <GenerateImagesButton
              postId={post.id}
              initialStatus={post.imageJobStatus}
              initialStage={post.imageJobStage}
              initialError={post.imageJobError}
            />
          </div>
        )}
      </section>

      {/* Publishing (superadmin) */}
      <section className="card p-6 grid gap-4">
        <p className="section-eyebrow">Publishing</p>
        {!isSuper ? (
          <p className="text-sm text-[color:var(--color-navy-600)]">
            Only a superadmin can publish, schedule, or delete posts.
          </p>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {post.isPublished ? (
                <form action={unpublishPost}>
                  <input type="hidden" name="id" value={post.id} />
                  <button className="btn btn-outline text-sm">Unpublish</button>
                </form>
              ) : (
                <form action={publishPost}>
                  <input type="hidden" name="id" value={post.id} />
                  <button className="btn btn-primary text-sm">Publish now</button>
                </form>
              )}
            </div>

            <form action={schedulePost} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={post.id} />
              <label className="grid gap-1 text-sm">
                Schedule for
                <input
                  type="datetime-local"
                  name="scheduledFor"
                  defaultValue={toLocalInput(post.scheduledFor)}
                  className="field-input"
                />
              </label>
              <button className="btn btn-outline text-sm">Save schedule</button>
            </form>

            <form
              action={deletePost}
              className="pt-2 border-t border-[color:var(--color-navy-100)]"
            >
              <input type="hidden" name="id" value={post.id} />
              <button className="btn btn-outline text-sm text-red-700 border-red-200">
                Delete post
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
