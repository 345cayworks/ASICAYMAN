"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, requireSuperadmin } from "@/lib/rbac";
import { getStorage } from "@/lib/storage";
import { slugify, parseTags } from "@/lib/blog/slug";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

async function uniqueSlug(desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired);
  let slug = base;
  let n = 1;
  // Loop is bounded in practice; each miss just appends -2, -3, ...
  for (;;) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

function audit(
  actor: { id?: string | null; email?: string | null },
  action: string,
  postId: string,
  details?: Prisma.InputJsonValue,
) {
  return prisma.auditLog.create({
    data: {
      actorUserId: actor.id ?? null,
      actorEmail: actor.email ?? null,
      action,
      entity: `BlogPost:${postId}`,
      details: details ?? undefined,
    },
  });
}

function refreshPublic(slug?: string) {
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

// --- Create / update ---------------------------------------------------------

export async function createPost(formData: FormData) {
  const user = await requireAdmin();
  const title = str(formData, "title");
  if (!title) redirect("/admin/blog?error=" + encodeURIComponent("Title is required."));

  const slug = await uniqueSlug(str(formData, "slug") || title);
  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      summary: str(formData, "summary") || null,
      body: str(formData, "body"),
      seoDescription: str(formData, "seoDescription") || null,
      tags: parseTags(str(formData, "tags")),
      source: "MANUAL",
      authorUserId: user.id ?? null,
    },
    select: { id: true },
  });
  await audit(user, "blog.create", post.id, { slug });
  revalidatePath("/admin/blog");
  redirect(`/admin/blog/${post.id}?ok=created`);
}

export async function updatePost(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!id || !title) redirect(`/admin/blog/${id}?error=` + encodeURIComponent("Title is required."));

  const slug = await uniqueSlug(str(formData, "slug") || title, id);
  await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      summary: str(formData, "summary") || null,
      body: str(formData, "body"),
      seoDescription: str(formData, "seoDescription") || null,
      tags: parseTags(str(formData, "tags")),
    },
  });
  await audit(user, "blog.update", id, { slug });
  refreshPublic(slug);
  redirect(`/admin/blog/${id}?ok=saved`);
}

// --- Publish / schedule (superadmin) ----------------------------------------

export async function publishPost(formData: FormData) {
  const user = await requireSuperadmin();
  const id = str(formData, "id");
  const post = await prisma.blogPost.update({
    where: { id },
    data: { isPublished: true, publishedAt: new Date(), scheduledFor: null },
    select: { slug: true },
  });
  await audit(user, "blog.publish", id);
  refreshPublic(post.slug);
  redirect(`/admin/blog/${id}?ok=published`);
}

export async function unpublishPost(formData: FormData) {
  const user = await requireSuperadmin();
  const id = str(formData, "id");
  const post = await prisma.blogPost.update({
    where: { id },
    data: { isPublished: false },
    select: { slug: true },
  });
  await audit(user, "blog.unpublish", id);
  refreshPublic(post.slug);
  redirect(`/admin/blog/${id}?ok=unpublished`);
}

export async function schedulePost(formData: FormData) {
  const user = await requireSuperadmin();
  const id = str(formData, "id");
  const when = str(formData, "scheduledFor");
  const date = when ? new Date(when) : null;
  if (when && Number.isNaN(date?.getTime())) {
    redirect(`/admin/blog/${id}?error=` + encodeURIComponent("Invalid schedule date."));
  }
  await prisma.blogPost.update({
    where: { id },
    data: { scheduledFor: date, isPublished: false },
  });
  await audit(user, "blog.schedule", id, { scheduledFor: date?.toISOString() ?? null });
  redirect(`/admin/blog/${id}?ok=scheduled`);
}

export async function deletePost(formData: FormData) {
  const user = await requireSuperadmin();
  const id = str(formData, "id");
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { coverImageKey: true, slug: true },
  });
  if (post?.coverImageKey) await getStorage().del(post.coverImageKey);
  await prisma.blogPost.delete({ where: { id } });
  await audit(user, "blog.delete", id);
  refreshPublic(post?.slug);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?ok=deleted");
}

// --- Cover image -------------------------------------------------------------

export async function uploadCover(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/blog/${id}?error=` + encodeURIComponent("Choose an image file."));
  }
  const f = file as File;
  if (!ALLOWED_IMAGE_TYPES.has(f.type)) {
    redirect(`/admin/blog/${id}?error=` + encodeURIComponent("Unsupported image type."));
  }
  if (f.size > MAX_IMAGE_BYTES) {
    redirect(`/admin/blog/${id}?error=` + encodeURIComponent("Image is larger than 8 MB."));
  }

  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { coverImageKey: true },
  });
  const stored = await getStorage().put({
    folder: "blog/covers",
    filename: f.name || "cover.png",
    contentType: f.type,
    body: Buffer.from(await f.arrayBuffer()),
  });
  await prisma.blogPost.update({
    where: { id },
    data: { coverImageKey: stored.key },
  });
  if (existing?.coverImageKey && existing.coverImageKey !== stored.key) {
    await getStorage().del(existing.coverImageKey);
  }
  await audit(user, "blog.cover.upload", id, { key: stored.key });
  redirect(`/admin/blog/${id}?ok=cover`);
}

export async function removeCover(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { coverImageKey: true },
  });
  if (post?.coverImageKey) await getStorage().del(post.coverImageKey);
  await prisma.blogPost.update({ where: { id }, data: { coverImageKey: null } });
  await audit(user, "blog.cover.remove", id);
  redirect(`/admin/blog/${id}?ok=cover-removed`);
}
