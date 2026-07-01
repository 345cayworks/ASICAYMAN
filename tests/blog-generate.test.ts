import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveConfig,
  resolveOption,
  selectTopic,
  selectAngle,
  TONES,
  LENGTHS,
  DEFAULT_TOPICS,
  DEFAULT_ANGLES,
  DEFAULT_TEXT_MODEL,
  GUIDANCE_MAX_CHARS,
} from "../src/lib/blog/config";
import {
  buildSystemPrompt,
  buildUserPrompt,
  extractJsonObject,
  parsePostJSON,
  generateDraft,
  IDEMPOTENCY_WINDOW_MS,
  type GenerateDeps,
} from "../src/lib/blog/generate";

// --- config / rotation -------------------------------------------------------

test("resolveOption falls back to the first entry on unknown/blank", () => {
  assert.equal(resolveOption(TONES, "nope").key, TONES[0].key);
  assert.equal(resolveOption(TONES, null).key, TONES[0].key);
  assert.equal(resolveOption(TONES, "warm").key, "warm");
});

test("resolveConfig applies defaults and caps guidance", () => {
  const c = resolveConfig({});
  assert.equal(c.tone.key, "practical");
  assert.equal(c.length.key, "standard");
  assert.equal(c.audience.key, "both");
  assert.equal(c.creativity.key, "balanced");
  assert.equal(c.model, DEFAULT_TEXT_MODEL);
  assert.deepEqual(c.topics, DEFAULT_TOPICS);
  assert.deepEqual(c.angles, DEFAULT_ANGLES);

  const long = resolveConfig({ guidance: "x".repeat(1000) });
  assert.equal(long.guidance.length, GUIDANCE_MAX_CHARS);
});

test("resolveConfig honours overrides", () => {
  const c = resolveConfig({ model: "claude-opus-4-8", topics: ["A", "B"], angles: ["one"] });
  assert.equal(c.model, "claude-opus-4-8");
  assert.deepEqual(c.topics, ["A", "B"]);
});

test("selectTopic rotates by AI post count", () => {
  const topics = ["a", "b", "c"];
  assert.equal(selectTopic(topics, 0), "a");
  assert.equal(selectTopic(topics, 1), "b");
  assert.equal(selectTopic(topics, 3), "a");
  assert.equal(selectTopic(topics, 4), "b");
});

test("selectAngle advances one angle per full pass through topics", () => {
  const topics = ["a", "b", "c"];
  const angles = ["x", "y"];
  // pass 0 (counts 0,1,2)
  assert.equal(selectAngle(angles, 0, topics.length), "x");
  assert.equal(selectAngle(angles, 2, topics.length), "x");
  // pass 1 (counts 3,4,5)
  assert.equal(selectAngle(angles, 3, topics.length), "y");
  // pass 2 wraps back
  assert.equal(selectAngle(angles, 6, topics.length), "x");
  assert.equal(selectAngle([], 0, 3), null);
});

// --- prompt building ---------------------------------------------------------

test("system prompt reflects tone/audience/length and guidance", () => {
  const config = resolveConfig({ tone: "warm", guidance: "Mention stewardship." });
  const sys = buildSystemPrompt(config);
  assert.ok(sys.includes(config.tone.phrase));
  assert.ok(sys.includes(config.audience.phrase));
  assert.ok(sys.includes(LENGTHS[0].words));
  assert.ok(sys.includes("Mention stewardship."));
  assert.ok(sys.includes("JSON"));
});

test("user prompt includes topic, angle and recent titles to avoid", () => {
  const u = buildUserPrompt({ topic: "Faith and finance", angle: "a how-to guide", recentTitles: ["Old One"] });
  assert.ok(u.includes("Faith and finance"));
  assert.ok(u.includes("a how-to guide"));
  assert.ok(u.includes("Old One"));
});

// --- defensive parsing -------------------------------------------------------

test("extractJsonObject tolerates fences and surrounding prose", () => {
  const raw = "Sure!\n```json\n{\"a\":1}\n```\nThanks";
  assert.equal(extractJsonObject(raw), '{"a":1}');
});

test("parsePostJSON parses a valid object and derives a slug", () => {
  const post = parsePostJSON(
    '{"title":"Hello World","summary":"s","body":"# Hi","tags":["a","b"],"seoDescription":"d"}',
  );
  assert.equal(post.title, "Hello World");
  assert.equal(post.slug, "hello-world");
  assert.deepEqual(post.tags, ["a", "b"]);
});

test("parsePostJSON uses provided slug, coerces odd tags", () => {
  const post = parsePostJSON('{"title":"T","slug":"Custom Slug!","body":"b","tags":"nope"}');
  assert.equal(post.slug, "custom-slug");
  assert.deepEqual(post.tags, []);
});

test("parsePostJSON throws on missing title or body", () => {
  assert.throws(() => parsePostJSON('{"body":"b"}'));
  assert.throws(() => parsePostJSON('{"title":"t"}'));
  assert.throws(() => parsePostJSON("not json at all"));
});

// --- orchestration (injected deps, no network/DB) ----------------------------

function baseDeps(overrides: Partial<GenerateDeps> = {}): GenerateDeps {
  return {
    loadRawConfig: async () => ({}),
    countAiPosts: async () => 0,
    recentTitles: async () => [],
    lastAiPostAt: async () => null,
    callLLM: async () => '{"title":"T","body":"Body here"}',
    savePost: async (p) => ({ id: "post1", slug: p.slug }),
    now: () => new Date("2026-06-30T12:00:00Z"),
    ...overrides,
  };
}

test("generateDraft creates a draft on the happy path", async () => {
  const r = await generateDraft(baseDeps());
  assert.equal(r.status, "created");
  if (r.status === "created") assert.equal(r.postId, "post1");
});

test("generateDraft skips when a recent AI post exists", async () => {
  const r = await generateDraft(
    baseDeps({
      lastAiPostAt: async () => new Date("2026-06-30T06:00:00Z"), // 6h before "now"
    }),
  );
  assert.equal(r.status, "skipped");
});

test("generateDraft runs anyway when forced past the idempotency window", async () => {
  const r = await generateDraft(
    baseDeps({ lastAiPostAt: async () => new Date("2026-06-30T11:59:00Z") }),
    { force: true },
  );
  assert.equal(r.status, "created");
});

test("idempotency window is 18h", () => {
  assert.equal(IDEMPOTENCY_WINDOW_MS, 18 * 60 * 60 * 1000);
});

test("generateDraft returns error on unparseable model output", async () => {
  const r = await generateDraft(baseDeps({ callLLM: async () => "sorry, no json" }));
  assert.equal(r.status, "error");
});

test("generateDraft returns error when the LLM call throws", async () => {
  const r = await generateDraft(
    baseDeps({
      callLLM: async () => {
        throw new Error("429 rate limited");
      },
    }),
  );
  assert.equal(r.status, "error");
  if (r.status === "error") assert.ok(r.reason.includes("429"));
});
