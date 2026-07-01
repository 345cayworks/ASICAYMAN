/**
 * Minimal OpenAI Images API client over fetch (no SDK).
 * gpt-image-1 returns base64 PNG data; we decode to a Buffer.
 */

export interface GenerateImageOpts {
  apiKey: string;
  prompt: string;
  model?: string;
  size?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface ImagesResponse {
  data?: Array<{ b64_json?: string }>;
}

export async function generateImage(opts: GenerateImageOpts): Promise<Buffer> {
  const doFetch = opts.fetchImpl ?? fetch;
  const res = await doFetch(`${opts.baseUrl ?? "https://api.openai.com"}/v1/images/generations`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${opts.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? "gpt-image-1",
      prompt: opts.prompt,
      size: opts.size ?? "1536x1024",
      n: 1,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI images ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as ImagesResponse;
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned");
  return Buffer.from(b64, "base64");
}
