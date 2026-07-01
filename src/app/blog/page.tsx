import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Blog",
  description:
    "Insights, stories, and practical guidance for the Adventist Business Community in the Cayman Islands.",
};

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      coverImageKey: true,
      publishedAt: true,
      tags: true,
    },
    take: 60,
  });

  return (
    <section className="mx-auto max-w-6xl px-5 lg:px-8 pt-16 md:pt-20 pb-16">
      <p className="section-eyebrow">Blog</p>
      <h1 className="mt-4 text-4xl md:text-5xl font-display tracking-tight">
        Stories &amp; insight from our community.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-[color:var(--color-navy-700)] leading-relaxed">
        Practical guidance and encouragement for Adventist business owners and
        professionals across the Cayman Islands.
      </p>

      {posts.length === 0 ? (
        <p className="mt-12 text-[color:var(--color-navy-600)]">No posts yet — check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="card overflow-hidden group flex flex-col hover:border-[color:var(--color-navy-300)] transition-colors"
            >
              {p.coverImageKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/blog/images/${p.coverImageKey}`}
                  alt={p.title}
                  className="w-full aspect-[16/9] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[16/9] bg-[color:var(--color-cream)]" />
              )}
              <div className="p-5 flex flex-col flex-1">
                <h2 className="font-display text-xl leading-snug">{p.title}</h2>
                {p.summary && (
                  <p className="mt-2 text-sm text-[color:var(--color-navy-700)] leading-relaxed line-clamp-3">
                    {p.summary}
                  </p>
                )}
                <p className="mt-4 pt-3 border-t border-[color:var(--color-navy-100)] text-xs text-[color:var(--color-navy-500)]">
                  {p.publishedAt
                    ? p.publishedAt.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
