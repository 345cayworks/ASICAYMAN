import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, parseTags } from "../src/lib/blog/slug";

test("slugify lowercases and hyphenates", () => {
  assert.equal(slugify("Hello World"), "hello-world");
  assert.equal(slugify("  Trim  Me  "), "trim-me");
});

test("slugify strips punctuation and accents", () => {
  assert.equal(slugify("Café & Co!"), "cafe-co");
  assert.equal(slugify("A/B: test?"), "a-b-test");
});

test("slugify falls back to 'post' for empty input", () => {
  assert.equal(slugify(""), "post");
  assert.equal(slugify("!!!"), "post");
});

test("slugify caps length", () => {
  assert.ok(slugify("x".repeat(200)).length <= 80);
});

test("parseTags splits, trims, and de-dupes case-insensitively", () => {
  assert.deepEqual(parseTags("Cayman, business, Business,  faith "), [
    "Cayman",
    "business",
    "faith",
  ]);
  assert.deepEqual(parseTags(""), []);
  assert.deepEqual(parseTags("a\nb, a"), ["a", "b"]);
});
