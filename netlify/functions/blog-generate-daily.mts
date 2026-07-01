import type { Config } from "@netlify/functions";

/**
 * Daily scheduled function: asks the app to generate one AI DRAFT post.
 * Thin by design -- all logic lives in the Next route so we never bundle
 * Prisma into this function. Auth via the shared CRON_SECRET.
 */
export default async function handler() {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    return new Response(
      JSON.stringify({ skipped: "Missing URL or CRON_SECRET" }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }
  const res = await fetch(`${base}/api/cron/blog-generate`, {
    method: "POST",
    headers: { authorization: secret },
  });
  const body = await res.text();
  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

// 13:00 UTC daily (~8am Cayman).
export const config: Config = { schedule: "0 13 * * *" };
