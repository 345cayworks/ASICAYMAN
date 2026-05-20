// Pure validators for tracking IDs. No IO, no framework imports — safe to
// import from tests, server components, server actions, or the analytics
// renderer.

const GA_ID_RE = /^G-[A-Z0-9]+$/;
const FB_PIXEL_RE = /^\d{6,20}$/;

export function normalizeGaId(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidGaId(input: string): boolean {
  return GA_ID_RE.test(input);
}

export function isValidFbPixelId(input: string): boolean {
  return FB_PIXEL_RE.test(input);
}
