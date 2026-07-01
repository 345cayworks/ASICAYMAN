import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildArtDirectorUser,
  parseImagePrompts,
  fallbackPrompts,
  withHouseStyle,
  insertInTextImage,
  runImagePipeline,
  HOUSE_STYLE,
  BODY_TRUNCATE_CHARS,
  type ImagePipelineDeps,
} from "../src/lib/blog/images";

// --- prompt building / parsing ----------------------------------------------

test("art-director user prompt truncates the body", () => {
  const long = "x".repeat(BODY_TRUNCATE_CHARS + 500);
  const u = buildArtDirectorUser("Title", long);
  assert.ok(u.includes("Title"));
  assert.ok(!u.includes("x".repeat(BODY_TRUNCATE_CHARS + 1)));
});

test("parseImagePrompts reads valid JSON (fence/prose tolerant)", () => {
  const raw = 'Here you go:\n```json\n{"cover":"a wide scene","inText":"a close detail"}\n```';
  const p = parseImagePrompts(raw, "T");
  assert.equal(p.cover, "a wide scene");
  assert.equal(p.inText, "a close detail");
});

test("parseImagePrompts falls back to title-derived prompts on bad output", () => {
  const p = parseImagePrompts("no json here", "Faith and Finance");
  assert.deepEqual(p, fallbackPrompts("Faith and Finance"));
  assert.ok(p.cover.includes("Faith and Finance"));
});

test("parseImagePrompts falls back when a key is missing", () => {
  const p = parseImagePrompts('{"cover":"only cover"}', "T");
  assert.deepEqual(p, fallbackPrompts("T"));
});

test("withHouseStyle appends the fixed suffix to both prompts", () => {
  const p = withHouseStyle({ cover: "c", inText: "i" });
  assert.equal(p.cover, `c ${HOUSE_STYLE}`);
  assert.equal(p.inText, `i ${HOUSE_STYLE}`);
});

// --- body insertion ----------------------------------------------------------

test("insertInTextImage inserts after the first paragraph", () => {
  const body = "First para.\n\nSecond para.";
  const out = insertInTextImage(body, "/api/blog/images/blog/x.png", "Alt");
  assert.equal(out, "First para.\n\n![Alt](/api/blog/images/blog/x.png)\n\nSecond para.");
});

test("insertInTextImage skips a leading heading", () => {
  const body = "# Heading\n\nIntro paragraph.\n\nMore.";
  const out = insertInTextImage(body, "/u.png", "Alt");
  const blocks = out.split(/\n{2,}/);
  assert.equal(blocks[0], "# Heading");
  assert.equal(blocks[1], "Intro paragraph.");
  assert.equal(blocks[2], "![Alt](/u.png)");
});

test("insertInTextImage appends when there is no paragraph break", () => {
  assert.equal(insertInTextImage("Just one line", "/u.png", "Alt"), "Just one line\n\n![Alt](/u.png)");
  assert.equal(insertInTextImage("", "/u.png", "Alt"), "![Alt](/u.png)");
});

// --- pipeline orchestration (injected deps) ----------------------------------

test("runImagePipeline: prompts, renders both, stores, one finalize, deletes old cover", async () => {
  const calls: string[] = [];
  const stages: string[] = [];
  const rendered: string[] = [];
  const finalizeCalls: Array<{ coverImageKey: string; body: string }> = [];
  const deleted: string[] = [];

  const deps: ImagePipelineDeps = {
    post: { id: "p1", title: "My Post", body: "Intro.\n\nBody.", coverImageKey: "blog/p1/old-cover.png" },
    artDirect: async () => {
      calls.push("artDirect");
      return '{"cover":"wide","inText":"detail"}';
    },
    renderImage: async (prompt) => {
      rendered.push(prompt);
      return Buffer.from(`img:${prompt}`);
    },
    storeImage: async (kind) => {
      calls.push(`store:${kind}`);
      return `blog/p1/new-${kind}.png`;
    },
    deleteBlob: async (key) => {
      deleted.push(key);
    },
    finalize: async (arg) => {
      finalizeCalls.push(arg);
    },
    setStage: async (s) => {
      stages.push(s);
    },
    imageUrl: (key) => `/api/blog/images/${key}`,
  };

  await runImagePipeline(deps);

  // Stages advance in order.
  assert.deepEqual(stages, ["prompts", "rendering", "finishing"]);
  // Both prompts rendered, each carrying the house style.
  assert.equal(rendered.length, 2);
  assert.ok(rendered[0].includes(HOUSE_STYLE));
  assert.ok(rendered[1].includes(HOUSE_STYLE));
  // Single finalize wiring cover + in-text image into the body.
  assert.equal(finalizeCalls.length, 1);
  assert.equal(finalizeCalls[0].coverImageKey, "blog/p1/new-cover.png");
  assert.ok(finalizeCalls[0].body.includes("![My Post](/api/blog/images/blog/p1/new-intext.png)"));
  // Old cover removed.
  assert.deepEqual(deleted, ["blog/p1/old-cover.png"]);
});

test("runImagePipeline: no delete when there was no previous cover", async () => {
  const deleted: string[] = [];
  const deps: ImagePipelineDeps = {
    post: { id: "p2", title: "T", body: "Body.", coverImageKey: null },
    artDirect: async () => '{"cover":"c","inText":"i"}',
    renderImage: async () => Buffer.from("x"),
    storeImage: async (kind) => `blog/p2/${kind}.png`,
    deleteBlob: async (key) => {
      deleted.push(key);
    },
    finalize: async () => {},
    setStage: async () => {},
    imageUrl: (key) => `/api/blog/images/${key}`,
  };
  await runImagePipeline(deps);
  assert.deepEqual(deleted, []);
});
