/**
 * Safe Markdown to HTML renderer.
 *
 * The body of a blog post is author- or LLM-authored Markdown that we render
 * into a page. We must NEVER dump it as raw HTML. The strategy is
 * escape-first + allowlist:
 *
 *   1. HTML-escape the ENTIRE input, so no script/img/tag of any kind can
 *      survive (every "<" becomes "&lt;").
 *   2. Re-introduce ONLY a known-safe subset by translating Markdown syntax
 *      into a fixed set of tags: headings, paragraphs, lists, blockquotes,
 *      bold/italic/code, safe links, and safe images.
 *
 * Because links/images carry URLs, those URLs are validated against a scheme
 * allowlist (http(s) / mailto / root-relative); "javascript:" and friends are
 * dropped. This lets AI-inserted inline images render while blocking script/
 * HTML injection from either the author or the model.
 *
 * Pure and dependency-free so it is trivially unit-testable.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type UrlKind = "internal" | "external" | "mailto";

/** Classify a URL, or null if it isn't on the allowlist. */
export function classifyUrl(raw: string): UrlKind | null {
  const url = raw.trim();
  if (/^https?:\/\//i.test(url)) return "external";
  if (/^mailto:/i.test(url)) return "mailto";
  // Root-relative, but NOT protocol-relative ("//evil.com").
  if (/^\/(?!\/)/.test(url)) return "internal";
  return null;
}

/** Links allow http(s)/mailto/root-relative. */
function safeLink(label: string, url: string): string {
  const kind = classifyUrl(url);
  if (!kind) return label; // drop the link, keep the (escaped) label text
  const rel = kind === "external" ? ' rel="nofollow noopener" target="_blank"' : "";
  return `<a href="${url}"${rel}>${label}</a>`;
}

/** Images allow only http(s)/root-relative (never mailto). */
function safeImage(alt: string, url: string): string {
  const kind = classifyUrl(url);
  if (kind !== "external" && kind !== "internal") return ""; // drop entirely
  return `<img src="${url}" alt="${alt}" loading="lazy">`;
}

// Apply the non-code inline rules (image, link, bold, italic) to a segment
// that is guaranteed to contain no code span.
function inlineNonCode(seg: string): string {
  let s = seg.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) =>
    safeImage(alt, url),
  );
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) =>
    safeLink(label, url),
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return s;
}

// Inline spans, applied to already-escaped text. Splitting on code spans keeps
// Markdown inside them literal without any placeholder/sentinel bookkeeping:
// odd-indexed segments are the code spans.
function renderInline(escaped: string): string {
  return escaped
    .split(/(`[^`]+`)/)
    .map((part, idx) =>
      idx % 2 === 1 ? `<code>${part.slice(1, -1)}</code>` : inlineNonCode(part),
    )
    .join("");
}

// Blockquote lines start with an escaped ">" (i.e. "&gt;").
const BLOCKQUOTE_RE = /^&gt;\s?(.*)$/;
const HEADING_RE = /^(#{1,3})\s+(.*)$/;
const UL_RE = /^[-*]\s+(.*)$/;
const OL_RE = /^\d+\.\s+(.*)$/;

/** Render Markdown to a safe HTML string. */
export function renderMarkdown(src: string): string {
  const lines = escapeHtml(src ?? "").replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  const flushList = (items: string[], tag: "ul" | "ol") => {
    if (!items.length) return;
    out.push(
      `<${tag}>${items.map((it) => `<li>${renderInline(it)}</li>`).join("")}</${tag}>`,
    );
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (BLOCKQUOTE_RE.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && BLOCKQUOTE_RE.test(lines[i])) {
        quote.push(lines[i].replace(BLOCKQUOTE_RE, "$1"));
        i++;
      }
      out.push(`<blockquote><p>${renderInline(quote.join(" "))}</p></blockquote>`);
      continue;
    }

    if (UL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_RE.test(lines[i])) {
        items.push(lines[i].replace(UL_RE, "$1"));
        i++;
      }
      flushList(items, "ul");
      continue;
    }

    if (OL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL_RE.test(lines[i])) {
        items.push(lines[i].replace(OL_RE, "$1"));
        i++;
      }
      flushList(items, "ol");
      continue;
    }

    // Paragraph: gather consecutive non-blank, non-structural lines.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !HEADING_RE.test(lines[i]) &&
      !BLOCKQUOTE_RE.test(lines[i]) &&
      !UL_RE.test(lines[i]) &&
      !OL_RE.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${renderInline(para.join(" "))}</p>`);
  }

  return out.join("\n");
}
