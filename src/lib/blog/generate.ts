/**
 * AI blog post generator (framework-agnostic).
 *
 * The pure pieces -- prompt building, topic/angle rotation, and defensive JSON
 * parsing -- are exported and unit-tested without any network or DB. The
 * orchestration `generateDraft` takes all of its I/O as injected deps, so it is
 * equally testable and can be driven from either the cron route or the admin
 * action.
 *
 * It only ever produces DRAFTS (isPublished=false, source=AI) for human review.
 */

import {
  GeneratorConfig,
  RawConfig,
  resolveConfig,
  selectTopic,
  selectAngle,
} from "./config";
import { slugify } from "./slug";

export const BRAND_VOICE =
  "Write in a confident, Caymanian, practical, and faith-friendly voice for a " +
  "Seventh-day Adventist business community in the Cayman Islands. Use Cayman " +
  "Islands dollars (KYD) if money is mentioned. Avoid US-centric idioms and " +
  "empty business buzzwords. Be genuine and grounded.";

export interface GeneratedPost {
  title: string;
  slug: string;
  summary: string;
  body: string;
  tags: string[];
  seoDescription: string;
}

export interface LLMRequest {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
}

// Guards double-runs of the daily job.
export const IDEMPOTENCY_WINDOW_MS = 18 * 60 * 60 * 1000;

export function buildSystemPrompt(config: GeneratorConfig): string {
  const lines = [
    "You are a skilled writer for the Adventist Business Community (ABC), a " +
      "network of Seventh-day Adventist business owners and professionals in " +
      "the Cayman Islands.",
    BRAND_VOICE,
    `Tone: ${config.tone.phrase}.`,
    `Audience: write for ${config.audience.phrase}.`,
    `Target length: ${config.length.words}.`,
  ];
  if (config.guidance) lines.push(`Additional editorial guidance: ${config.guidance}`);
  lines.push(
    "Return ONLY a single JSON object -- no prose, no code fences -- with " +
      'exactly these keys: "title" (string), "slug" (url-safe kebab-case ' +
      'string), "summary" (one or two sentences), "body" (the article in ' +
      'Markdown; you may use ## headings, lists, and **bold**), "tags" (array ' +
      'of 2-5 short strings), "seoDescription" (<= 160 characters). Do not ' +
      "include any images or HTML in the body.",
  );
  return lines.join("\n\n");
}

export function buildUserPrompt(opts: {
  topic: string;
  angle: string | null;
  recentTitles: string[];
}): string {
  const parts = [`Write a blog post about: ${opts.topic}.`];
  if (opts.angle) parts.push(`Approach it as ${opts.angle}.`);
  if (opts.recentTitles.length) {
    parts.push(
      "Do NOT repeat or closely mirror any of these recent post titles:\n" +
        opts.recentTitles.map((t) => `- ${t}`).join("\n"),
    );
  }
  parts.push("Respond with only the JSON object described in your instructions.");
  return parts.join("\n\n");
}

/** Pull the outermost {...} out of a model response (tolerates fences/prose). */
export function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in model output");
  }
  return raw.slice(start, end + 1);
}

/** Parse + validate a generated post. Throws on missing required fields. */
export function parsePostJSON(raw: string): GeneratedPost {
  const obj = JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;

  const title = String(obj.title ?? "").trim();
  const body = String(obj.body ?? "").trim();
  if (!title) throw new Error("Missing title");
  if (!body) throw new Error("Missing body");

  const slug = slugify(String(obj.slug ?? "").trim() || title);
  const summary = String(obj.summary ?? "").trim();
  const seoDescription = String(obj.seoDescription ?? "").trim().slice(0, 300);
  const tags = Array.isArray(obj.tags)
    ? obj.tags
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  return { title, slug, summary, body, tags, seoDescription };
}

export interface GenerateDeps {
  loadRawConfig: () => Promise<RawConfig>;
  countAiPosts: () => Promise<number>;
  recentTitles: (limit: number) => Promise<string[]>;
  lastAiPostAt: () => Promise<Date | null>;
  callLLM: (req: LLMRequest) => Promise<string>;
  savePost: (post: GeneratedPost) => Promise<{ id: string; slug: string }>;
  now: () => Date;
}

export type GenerateResult =
  | { status: "created"; postId: string; slug: string; topic: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; reason: string };

export async function generateDraft(
  deps: GenerateDeps,
  opts: { force?: boolean } = {},
): Promise<GenerateResult> {
  // Idempotency: skip if a recent AI post already exists (unless forced).
  if (!opts.force) {
    const last = await deps.lastAiPostAt();
    if (last && deps.now().getTime() - last.getTime() < IDEMPOTENCY_WINDOW_MS) {
      return { status: "skipped", reason: "An AI post was generated within the last 18h" };
    }
  }

  const config = resolveConfig(await deps.loadRawConfig());
  const count = await deps.countAiPosts();
  const topic = selectTopic(config.topics, count);
  const angle = selectAngle(config.angles, count, config.topics.length);
  const recentTitles = await deps.recentTitles(10);

  let text: string;
  try {
    text = await deps.callLLM({
      model: config.model,
      system: buildSystemPrompt(config),
      user: buildUserPrompt({ topic, angle, recentTitles }),
      maxTokens: config.length.maxTokens,
      temperature: config.creativity.temperature,
    });
  } catch (e) {
    return { status: "error", reason: `LLM request failed: ${errMsg(e)}` };
  }

  let post: GeneratedPost;
  try {
    post = parsePostJSON(text);
  } catch (e) {
    return { status: "error", reason: `Could not parse model output: ${errMsg(e)}` };
  }

  const saved = await deps.savePost(post);
  return { status: "created", postId: saved.id, slug: saved.slug, topic };
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
