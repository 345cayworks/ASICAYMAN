import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, isPublished: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not found" };

  const description = post.seoDescription ?? post.summary ?? undefined;
  const canonical = `/blog/${post.slug}`;
  const image = post.coverImageKey ? `/api/blog/images/${post.coverImageKey}` : undefined;

  return {
    title: post.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: canonical,
      publishedTime: post.publishedAt?.toISOString(),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const coverSrc = post.coverImageKey ? `/api/blog/images/${post.coverImageKey}` : null;
  const html = renderMarkdown(post.body);

  return (
    <article className="mx-auto max-w-3xl px-5 lg:px-8 pt-12 md:pt-16 pb-20">
      <Link href="/blog" className="text-sm text-[color:var(--color-navy-600)] hover:text-[color:var(--color-navy-900)]">
        ← Blog
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl md:text-4xl font-display tracking-tight leading-tight">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-navy-500)]">
          {post.publishedAt
            ? post.publishedAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </p>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="badge badge-paid">{t}</span>
            ))}
          </div>
        )}
      </header>

      {coverSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverSrc}
          alt={post.title}
          className="mt-8 w-full rounded-2xl border border-[color:var(--color-navy-100)]"
        />
      )}

      {post.summary && (
        <p className="mt-8 text-lg text-[color:var(--color-navy-700)] leading-relaxed font-medium">
          {post.summary}
        </p>
      )}

      <div
        className="blog-content mt-8"
        // Safe: renderMarkdown escapes first, then re-introduces an allowlisted
        // subset of tags (see src/lib/markdown.ts). No raw HTML survives.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
