/**
 * Server-side wiring + orchestration for the two-image job.
 *
 * Uses RELATIVE imports (../db, ../storage) rather than the "@/" alias so the
 * standalone Netlify background function can bundle it directly without alias
 * resolution. Imported by that worker; it performs the atomic job claim, runs
 * the pipeline while persisting each stage, and records DONE/ERROR.
 */
import { prisma } from "../db";
import { getStorage } from "../storage";
import { callClaudeText } from "./llm";
import { generateImage } from "./openai-image";
import { runImagePipeline, type ImagePipelinePost } from "./images";

const TEXT_MODEL = process.env.TEXT_LLM_MODEL || "claude-sonnet-5";
const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-1";

export type ImageJobResult = { status: "done" | "skipped" | "error"; reason?: string };

async function markError(postId: string, reason: string) {
  await prisma.blogPost
    .update({
      where: { id: postId },
      data: {
        imageJobStatus: "ERROR",
        imageJobStage: "error",
        imageJobError: reason.slice(0, 500),
        imageJobUpdatedAt: new Date(),
      },
    })
    .catch(() => {
      /* best effort — never throw out of the worker */
    });
}

export async function runImageJob(postId: string): Promise<ImageJobResult> {
  const textKey = process.env.TEXT_LLM_API_KEY;
  const imageKey = process.env.IMAGE_API_KEY;
  if (!imageKey) return { status: "error", reason: "IMAGE_API_KEY not set" };
  if (!textKey) return { status: "error", reason: "TEXT_LLM_API_KEY not set (art director)" };

  // Atomic claim PENDING -> RUNNING. If the row isn't PENDING, updateMany
  // touches 0 rows and we no-op: this prevents double-runs AND makes a stray
  // public invocation harmless, so no separate worker secret is needed.
  const claimed = await prisma.blogPost.updateMany({
    where: { id: postId, imageJobStatus: "PENDING" },
    data: {
      imageJobStatus: "RUNNING",
      imageJobStage: "prompts",
      imageJobError: null,
      imageJobUpdatedAt: new Date(),
    },
  });
  if (claimed.count === 0) return { status: "skipped", reason: "Job not in PENDING state" };

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { id: true, title: true, body: true, coverImageKey: true },
  });
  if (!post) {
    await markError(postId, "Post not found");
    return { status: "error", reason: "Post not found" };
  }

  const storage = getStorage();

  try {
    await runImagePipeline({
      post: post as ImagePipelinePost,
      artDirect: (system, user) =>
        callClaudeText({ apiKey: textKey, model: TEXT_MODEL, system, user, maxTokens: 700, temperature: 0.7 }),
      renderImage: (prompt) => generateImage({ apiKey: imageKey, model: IMAGE_MODEL, prompt }),
      storeImage: async (kind, bytes) => {
        const stored = await storage.put({
          folder: `blog/${postId}`,
          filename: `${kind}.png`,
          contentType: "image/png",
          body: bytes,
        });
        return stored.key;
      },
      deleteBlob: (key) => storage.del(key),
      finalize: async ({ coverImageKey, body }) => {
        await prisma.blogPost.update({
          where: { id: postId },
          data: { coverImageKey, body, imageJobUpdatedAt: new Date() },
        });
      },
      setStage: async (stage) => {
        await prisma.blogPost.update({
          where: { id: postId },
          data: { imageJobStage: stage, imageJobUpdatedAt: new Date() },
        });
      },
      imageUrl: (key) => `/api/blog/images/${key}`,
    });

    await prisma.blogPost.update({
      where: { id: postId },
      data: { imageJobStatus: "DONE", imageJobStage: "done", imageJobUpdatedAt: new Date() },
    });
    return { status: "done" };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    await markError(postId, reason);
    return { status: "error", reason };
  }
}
