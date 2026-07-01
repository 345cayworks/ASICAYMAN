/**
 * Minimal Anthropic Messages API client over fetch (no SDK dependency).
 * Shared by the blog text generator and the image art-director prompt step.
 */

export interface ClaudeTextOpts {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
}

/** Call Claude and return the concatenated text output. Throws on API error. */
export async function callClaudeText(opts: ClaudeTextOpts): Promise<string> {
  const doFetch = opts.fetchImpl ?? fetch;
  const url = `${opts.baseUrl ?? "https://api.anthropic.com"}/v1/messages`;
  const headers = {
    "content-type": "application/json",
    "x-api-key": opts.apiKey,
    "anthropic-version": "2023-06-01",
  };
  const baseBody: Record<string, unknown> = {
    model: opts.model,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  };

  const send = (includeTemperature: boolean) =>
    doFetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(
        includeTemperature && opts.temperature !== undefined
          ? { ...baseBody, temperature: opts.temperature }
          : baseBody,
      ),
    });

  let res = await send(true);
  // Newer Claude models reject `temperature` ("deprecated for this model").
  // Transparently retry once without it so the creativity knob degrades
  // gracefully instead of failing generation.
  if (!res.ok && res.status === 400) {
    const detail = await res.text().catch(() => "");
    if (/temperature/i.test(detail)) {
      res = await send(false);
    } else {
      throw new Error(`Anthropic 400: ${detail.slice(0, 300)}`);
    }
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
  if (!text.trim()) throw new Error("Empty response from Anthropic");
  return text;
}
