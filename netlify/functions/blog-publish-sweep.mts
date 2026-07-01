import type { Config } from "@netlify/functions";

/**
 * Hourly scheduled function: publishes any post whose scheduledFor has passed.
 * Thin shim over the Next route; auth via the shared CRON_SECRET.
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
  const res = await fetch(`${base}/api/cron/blog-publish`, {
    method: "POST",
    headers: { authorization: secret },
  });
  const body = await res.text();
  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export const config: Config = { schedule: "0 * * * *" };
