/** URL-safe slug from arbitrary text. Pure + unit-testable. */
export function slugify(input: string): string {
  const base = (input ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return base || "post";
}

/** Split a comma/newline-separated tag string into a clean, de-duped list. */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of (raw ?? "").split(/[,\n]/)) {
    const tag = t.trim();
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      out.push(tag);
    }
  }
  return out;
}
