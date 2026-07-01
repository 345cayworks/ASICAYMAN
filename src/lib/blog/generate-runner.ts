/**
 * Server-side wiring for the blog generator: binds the pure `generateDraft`
 * pipeline to Prisma + the Anthropic API + env config. Imported by the cron
 * route and the admin "Generate with AI" action.
 *
 * Server-only: imports Prisma and reads secret env. Never import from a client
 * component.
 */
import { prisma } from "@/lib/db";
import { callClaudeText } from "./llm";
import { slugify } from "./slug";
import { RawConfig } from "./config";
import {
  generateDraft,
  type GenerateDeps,
  type GenerateResult,
} from "./generate";

export function textLlmConfigured(): boolean {
  return Boolean(process.env.TEXT_LLM_API_KEY);
}

async function uniqueSlug(desired: string): Promise<string> {
  const base = slugify(desired);
  let slug = base;
  let n = 1;
  for (;;) {
    const existing = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

async function loadRawConfig(): Promise<RawConfig> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: "blog.ai." } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const list = (key: string) =>
    (map.get(key) ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  return {
    tone: map.get("blog.ai.tone"),
    length: map.get("blog.ai.length"),
    audience: map.get("blog.ai.audience"),
    creativity: map.get("blog.ai.creativity"),
    model: map.get("blog.ai.model"),
    guidance: map.get("blog.ai.guidance"),
    topics: list("blog.ai.topics"),
    angles: list("blog.ai.angles"),
  };
}

export async function runGenerate(opts: { force?: boolean } = {}): Promise<GenerateResult> {
  const apiKey = process.env.TEXT_LLM_API_KEY;
  if (!apiKey) return { status: "error", reason: "TEXT_LLM_API_KEY is not set" };

  const deps: GenerateDeps = {
    loadRawConfig,
    countAiPosts: () => prisma.blogPost.count({ where: { source: "AI" } }),
    recentTitles: (limit) =>
      prisma.blogPost
        .findMany({ orderBy: { createdAt: "desc" }, take: limit, select: { title: true } })
        .then((rows) => rows.map((r) => r.title)),
    lastAiPostAt: () =>
      prisma.blogPost
        .findFirst({ where: { source: "AI" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } })
        .then((r) => r?.createdAt ?? null),
    callLLM: (req) =>
      callClaudeText({
        apiKey,
        model: req.model,
        system: req.system,
        user: req.user,
        maxTokens: req.maxTokens,
        temperature: req.temperature,
      }),
    savePost: async (post) => {
      const slug = await uniqueSlug(post.slug);
      const created = await prisma.blogPost.create({
        data: {
          title: post.title,
          slug,
          summary: post.summary || null,
          body: post.body,
          seoDescription: post.seoDescription || null,
          tags: post.tags,
          source: "AI",
          isPublished: false,
        },
        select: { id: true, slug: true },
      });
      await prisma.auditLog.create({
        data: {
          action: "blog.ai.generate",
          entity: `BlogPost:${created.id}`,
          details: { slug: created.slug },
        },
      });
      return created;
    },
    now: () => new Date(),
  };

  return generateDraft(deps, opts);
}

/** Publish sweep: make live any unpublished post whose scheduledFor has passed. */
export async function runPublishSweep(): Promise<{ published: number; slugs: string[] }> {
  const due = await prisma.blogPost.findMany({
    where: { isPublished: false, scheduledFor: { lte: new Date() } },
    select: { id: true, slug: true },
  });
  for (const p of due) {
    await prisma.blogPost.update({
      where: { id: p.id },
      data: { isPublished: true, publishedAt: new Date(), scheduledFor: null },
    });
  }
  if (due.length) {
    await prisma.auditLog.create({
      data: { action: "blog.publish.sweep", details: { count: due.length } },
    });
  }
  return { published: due.length, slugs: due.map((p) => p.slug) };
}
