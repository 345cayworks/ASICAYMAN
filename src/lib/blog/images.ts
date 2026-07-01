/**
 * Two-image generator for a blog post (framework-agnostic).
 *
 * A text LLM acts as art director and writes two image prompts from the
 * article; an image model renders them:
 *   - COVER: captures the whole essence of the article (hero/wide).
 *   - IN-TEXT: highlights one concrete element from the article.
 *
 * All I/O (LLM call, image render, blob storage, DB update, stage updates) is
 * injected, so the pure prompt-building, parsing, and body-insertion logic is
 * unit-tested offline. The orchestration runs the two renders in parallel.
 *
 * IMPORTANT: this is slow (~30-60s for two renders) and MUST run in a
 * background worker, never a synchronous request — see the START endpoint and
 * the Netlify *-background function.
 */

// Appended to every prompt for a consistent look and to forbid baked-in text.
export const HOUSE_STYLE =
  "Photorealistic, natural light, warm editorial style, Cayman Islands context, " +
  "no text, words, letters, logos, or watermarks anywhere in the image.";

export const BODY_TRUNCATE_CHARS = 6000;

export interface ImagePrompts {
  cover: string;
  inText: string;
}

export function buildArtDirectorSystem(): string {
  return [
    "You are an art director choosing photography for a blog article.",
    'Return ONLY a JSON object: {"cover": "...", "inText": "..."}. No prose, no code fences.',
    "cover = a single image capturing the WHOLE essence/mood of the article.",
    "inText = a single image highlighting ONE concrete element or moment from the article.",
    "Each value is 1 to 3 sentences, concrete and visual, describing a SCENE only.",
    "NEVER instruct that any text, words, letters, numbers, or logos appear in the image.",
    "Describe real, tasteful, photographic scenes — no collages, no infographics.",
  ].join("\n");
}

export function buildArtDirectorUser(title: string, body: string): string {
  const trimmed = (body ?? "").slice(0, BODY_TRUNCATE_CHARS);
  return `Article title: ${title}\n\nArticle body:\n${trimmed}\n\nReturn only the JSON object.`;
}

/** Deterministic prompts derived from the title, used when parsing fails. */
export function fallbackPrompts(title: string): ImagePrompts {
  const t = (title ?? "").trim() || "an Adventist-owned business in the Cayman Islands";
  return {
    cover: `A warm, editorial photograph that captures the spirit of "${t}": a welcoming Cayman Islands small-business scene with people at work.`,
    inText: `A close-up, concrete detail related to "${t}": hands at work in a small Caribbean business setting.`,
  };
}

/** Pull the outermost {...} from a model response, tolerating fences/prose. */
function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new Error("No JSON object");
  return raw.slice(start, end + 1);
}

/** Parse the art-director JSON; fall back to title-derived prompts on failure. */
export function parseImagePrompts(raw: string, title: string): ImagePrompts {
  try {
    const obj = JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
    const cover = String(obj.cover ?? "").trim();
    const inText = String(obj.inText ?? "").trim();
    if (!cover || !inText) throw new Error("Missing cover/inText");
    return { cover, inText };
  } catch {
    return fallbackPrompts(title);
  }
}

/** Append the fixed house-style suffix to both prompts. */
export function withHouseStyle(p: ImagePrompts): ImagePrompts {
  return {
    cover: `${p.cover} ${HOUSE_STYLE}`,
    inText: `${p.inText} ${HOUSE_STYLE}`,
  };
}

/**
 * Insert an in-text image after the first real paragraph (skipping a leading
 * heading), or append it if there's no suitable spot. Pure + testable.
 */
export function insertInTextImage(body: string, url: string, title: string): string {
  const md = `![${title}](${url})`;
  const blocks = (body ?? "").split(/\n{2,}/);
  let insertAfter = -1;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i].trim();
    if (b && !b.startsWith("#")) {
      insertAfter = i;
      break;
    }
  }
  if (insertAfter === -1) {
    const base = (body ?? "").trim();
    return base ? `${base}\n\n${md}` : md;
  }
  blocks.splice(insertAfter + 1, 0, md);
  return blocks.join("\n\n");
}

export interface ImagePipelinePost {
  id: string;
  title: string;
  body: string;
  coverImageKey: string | null;
}

export interface ImagePipelineDeps {
  post: ImagePipelinePost;
  /** Art-director LLM call: (system, user) -> raw text. */
  artDirect: (system: string, user: string) => Promise<string>;
  /** Render a prompt to PNG bytes. */
  renderImage: (prompt: string) => Promise<Buffer>;
  /** Store PNG bytes; returns the stored blob key. */
  storeImage: (kind: "cover" | "intext", bytes: Buffer) => Promise<string>;
  /** Remove a blob (old cover). */
  deleteBlob: (key: string) => Promise<void>;
  /** Single DB write: set coverImageKey + updated body. */
  finalize: (opts: { coverImageKey: string; body: string }) => Promise<void>;
  /** Persist the current stage for the polling UI. */
  setStage: (stage: string) => Promise<void>;
  /** Build the public URL for an in-text image key. */
  imageUrl: (key: string) => string;
}

/**
 * Run the full pipeline: prompts -> render both (parallel) -> store -> one DB
 * update wiring the cover key + in-text image into the body.
 */
export async function runImagePipeline(deps: ImagePipelineDeps): Promise<void> {
  await deps.setStage("prompts");
  const raw = await deps.artDirect(
    buildArtDirectorSystem(),
    buildArtDirectorUser(deps.post.title, deps.post.body),
  );
  const prompts = withHouseStyle(parseImagePrompts(raw, deps.post.title));

  await deps.setStage("rendering");
  const [coverBytes, inTextBytes] = await Promise.all([
    deps.renderImage(prompts.cover),
    deps.renderImage(prompts.inText),
  ]);
  const [coverKey, inTextKey] = await Promise.all([
    deps.storeImage("cover", coverBytes),
    deps.storeImage("intext", inTextBytes),
  ]);

  await deps.setStage("finishing");
  const newBody = insertInTextImage(deps.post.body, deps.imageUrl(inTextKey), deps.post.title);
  await deps.finalize({ coverImageKey: coverKey, body: newBody });

  const oldCover = deps.post.coverImageKey;
  if (oldCover && oldCover !== coverKey) {
    await deps.deleteBlob(oldCover);
  }
}

/** Feature gate: the two-image generator needs an image API key. */
export function imageApiConfigured(): boolean {
  return Boolean(process.env.IMAGE_API_KEY);
}
