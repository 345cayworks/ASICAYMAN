import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeGaId,
  isValidGaId,
  isValidFbPixelId,
} from "../src/lib/tracking-validate";

test("normalizeGaId trims whitespace and uppercases", () => {
  assert.equal(normalizeGaId("  g-abc123  "), "G-ABC123");
  assert.equal(normalizeGaId("g-abcdef"), "G-ABCDEF");
  assert.equal(normalizeGaId(""), "");
});

test("isValidGaId accepts well-formed IDs", () => {
  assert.equal(isValidGaId("G-XYZ123"), true);
  assert.equal(isValidGaId("G-0"), true);
  assert.equal(isValidGaId("G-ABCDEFGH"), true);
});

test("isValidGaId rejects empty and lowercase", () => {
  assert.equal(isValidGaId(""), false);
  assert.equal(isValidGaId("G-abc123"), false);
  assert.equal(isValidGaId("g-ABC123"), false);
});

test("isValidGaId rejects malformed and injection attempts", () => {
  assert.equal(isValidGaId("<script>alert(1)</script>"), false);
  assert.equal(isValidGaId("G-x; alert(1)"), false);
  assert.equal(isValidGaId(`12345"); alert(1);(`), false);
  assert.equal(isValidGaId("G-A B"), false);
  assert.equal(isValidGaId("UA-12345-1"), false);
  assert.equal(isValidGaId("G-"), false);
  assert.equal(isValidGaId("G-ABC\n"), false);
});

test("isValidFbPixelId accepts 6–20 digit strings", () => {
  assert.equal(isValidFbPixelId("123456"), true);
  assert.equal(isValidFbPixelId("12345678901234567890"), true);
  assert.equal(isValidFbPixelId("987654321"), true);
});

test("isValidFbPixelId rejects out-of-range and non-digit", () => {
  assert.equal(isValidFbPixelId(""), false);
  assert.equal(isValidFbPixelId("12345"), false);
  assert.equal(isValidFbPixelId("123456789012345678901"), false);
  assert.equal(isValidFbPixelId("abc123456"), false);
  assert.equal(isValidFbPixelId("123 456"), false);
  assert.equal(isValidFbPixelId("123-456-789"), false);
});

test("isValidFbPixelId rejects injection attempts", () => {
  assert.equal(isValidFbPixelId("<script>1234567</script>"), false);
  assert.equal(isValidFbPixelId(`1234567"); alert(1);(`), false);
  assert.equal(isValidFbPixelId("1234567; window.x=1"), false);
});
