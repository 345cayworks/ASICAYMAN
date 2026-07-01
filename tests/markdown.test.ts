import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown, classifyUrl, escapeHtml } from "../src/lib/markdown";

test("escapes raw HTML / script injection", () => {
  const html = renderMarkdown("Hello <script>alert(1)</script> world");
  assert.ok(!html.includes("<script>"), "no live script tag");
  assert.ok(html.includes("&lt;script&gt;"), "script is escaped");
});

test("escapeHtml handles the dangerous characters", () => {
  assert.equal(escapeHtml(`<a href="x">&`), "&lt;a href=&quot;x&quot;&gt;&amp;");
});

test("renders headings h1-h3", () => {
  assert.equal(renderMarkdown("# Title"), "<h1>Title</h1>");
  assert.equal(renderMarkdown("## Sub"), "<h2>Sub</h2>");
  assert.equal(renderMarkdown("### Small"), "<h3>Small</h3>");
});

test("renders bold, italic, and code", () => {
  assert.equal(renderMarkdown("**bold**"), "<p><strong>bold</strong></p>");
  assert.equal(renderMarkdown("*italic*"), "<p><em>italic</em></p>");
  assert.equal(renderMarkdown("`x = 1`"), "<p><code>x = 1</code></p>");
});

test("markdown inside a code span stays literal", () => {
  assert.equal(
    renderMarkdown("use `**not bold**` here"),
    "<p>use <code>**not bold**</code> here</p>",
  );
});

test("renders unordered and ordered lists", () => {
  assert.equal(renderMarkdown("- a\n- b"), "<ul><li>a</li><li>b</li></ul>");
  assert.equal(renderMarkdown("1. a\n2. b"), "<ol><li>a</li><li>b</li></ol>");
});

test("renders blockquotes", () => {
  assert.equal(renderMarkdown("> quoted"), "<blockquote><p>quoted</p></blockquote>");
});

test("internal (root-relative) links get no target", () => {
  assert.equal(
    renderMarkdown("[home](/about)"),
    `<p><a href="/about">home</a></p>`,
  );
});

test("external links get rel + target", () => {
  assert.equal(
    renderMarkdown("[site](https://example.com)"),
    `<p><a href="https://example.com" rel="nofollow noopener" target="_blank">site</a></p>`,
  );
});

test("javascript: and other unsafe link schemes are dropped, label kept", () => {
  assert.equal(renderMarkdown("[x](javascript:alert)"), "<p>x</p>");
  assert.equal(renderMarkdown("[x](data:text/html,evil)"), "<p>x</p>");
  // protocol-relative is not allowed
  assert.equal(renderMarkdown("[x](//evil.com)"), "<p>x</p>");
});

test("images: http(s) and root-relative render lazily", () => {
  assert.equal(
    renderMarkdown("![cover](/api/blog/images/blog/x.png)"),
    `<p><img src="/api/blog/images/blog/x.png" alt="cover" loading="lazy"></p>`,
  );
  assert.equal(
    renderMarkdown("![c](https://cdn.example.com/a.png)"),
    `<p><img src="https://cdn.example.com/a.png" alt="c" loading="lazy"></p>`,
  );
});

test("images: unsafe or mailto URLs are dropped entirely", () => {
  assert.equal(renderMarkdown("![x](javascript:alert)"), "<p></p>");
  assert.equal(renderMarkdown("![x](mailto:a@b.com)"), "<p></p>");
});

test("classifyUrl allowlist", () => {
  assert.equal(classifyUrl("https://a.com"), "external");
  assert.equal(classifyUrl("http://a.com"), "external");
  assert.equal(classifyUrl("mailto:a@b.com"), "mailto");
  assert.equal(classifyUrl("/blog/x"), "internal");
  assert.equal(classifyUrl("//evil.com"), null);
  assert.equal(classifyUrl("javascript:alert(1)"), null);
  assert.equal(classifyUrl("ftp://x"), null);
});

test("a URL cannot break out of the href attribute", () => {
  // The quote is escaped before link parsing, so no attribute break-out.
  const html = renderMarkdown(`[x](/a"onmouseover=alert(1))`);
  assert.ok(!html.includes(`"onmouseover`), "no raw quote break-out");
});
