import { test } from "node:test";
import assert from "node:assert/strict";
import { callClaudeText } from "../src/lib/blog/llm";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("callClaudeText retries without temperature on a deprecation 400", async () => {
  const bodies: Array<Record<string, unknown>> = [];
  const fake: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    bodies.push(body);
    if ("temperature" in body) {
      return jsonResponse(
        { error: { message: "`temperature` is deprecated for this model." } },
        400,
      );
    }
    return jsonResponse({ content: [{ type: "text", text: "hello" }] });
  };

  const out = await callClaudeText({
    apiKey: "k",
    model: "claude-sonnet-5",
    system: "s",
    user: "u",
    maxTokens: 10,
    temperature: 0.7,
    fetchImpl: fake,
  });

  assert.equal(out, "hello");
  assert.equal(bodies.length, 2);
  assert.ok("temperature" in bodies[0], "first attempt includes temperature");
  assert.ok(!("temperature" in bodies[1]), "retry omits temperature");
});

test("callClaudeText does not send temperature when it is undefined", async () => {
  let sentBody: Record<string, unknown> = {};
  const fake: typeof fetch = async (_url, init) => {
    sentBody = JSON.parse(String(init?.body));
    return jsonResponse({ content: [{ type: "text", text: "ok" }] });
  };
  const out = await callClaudeText({
    apiKey: "k",
    model: "m",
    system: "s",
    user: "u",
    maxTokens: 10,
    fetchImpl: fake,
  });
  assert.equal(out, "ok");
  assert.ok(!("temperature" in sentBody));
});

test("callClaudeText throws on a non-temperature 400", async () => {
  const fake: typeof fetch = async () =>
    jsonResponse({ error: { message: "invalid model" } }, 400);
  await assert.rejects(
    () => callClaudeText({ apiKey: "k", model: "m", system: "s", user: "u", maxTokens: 10, fetchImpl: fake }),
    /Anthropic 400/,
  );
});

test("callClaudeText concatenates text blocks and rejects an empty response", async () => {
  const multi: typeof fetch = async () =>
    jsonResponse({ content: [{ type: "text", text: "a" }, { type: "text", text: "b" }] });
  assert.equal(
    await callClaudeText({ apiKey: "k", model: "m", system: "s", user: "u", maxTokens: 10, fetchImpl: multi }),
    "ab",
  );

  const empty: typeof fetch = async () => jsonResponse({ content: [] });
  await assert.rejects(
    () => callClaudeText({ apiKey: "k", model: "m", system: "s", user: "u", maxTokens: 10, fetchImpl: empty }),
    /Empty response/,
  );
});
