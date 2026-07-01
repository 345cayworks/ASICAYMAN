import { runImageJob } from "../../src/lib/blog/images-runner";

/**
 * Long-running two-image worker. The "-background" suffix makes this a Netlify
 * Background Function (up to 15 minutes), which is required because rendering
 * two images takes ~30-60s and would blow a normal function's timeout.
 *
 * The START endpoint fires this with { postId } and returns immediately. The
 * job claims itself atomically (PENDING -> RUNNING) inside runImageJob, so a
 * stray or duplicate invocation is harmless.
 */
export default async function handler(req: Request): Promise<Response> {
  let postId = "";
  try {
    const body = (await req.json()) as { postId?: string };
    postId = body?.postId ?? "";
  } catch {
    /* fall through to the missing-postId response */
  }

  if (!postId) {
    return new Response(JSON.stringify({ error: "Missing postId" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const result = await runImageJob(postId);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
