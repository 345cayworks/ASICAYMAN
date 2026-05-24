import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HOUSE_NUDGES,
  pickDailyNudge,
  type HouseVariant,
} from "../src/components/ads/house-fallback-data";
import { AD_PLACEMENTS } from "../src/components/ads/placements";

const ROOT = join(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

// ============================================================
// Wrapper layout contract
// ============================================================

test("PageWithRightColumn renders the 1fr_320px grid", () => {
  const src = read("src/components/ads/page-with-right-column.tsx");
  assert.match(
    src,
    /grid\s+gap-6\s+lg:grid-cols-\[1fr_320px\]/,
    "wrapper must use the exact Cayworks layout grid",
  );
  assert.match(
    src,
    /min-w-0\s+space-y-6/,
    "main column must be min-w-0 so children can't widen the layout",
  );
});

test("PageWithRightColumn aside is sticky on lg+", () => {
  const src = read("src/components/ads/page-with-right-column.tsx");
  assert.match(
    src,
    /lg:sticky\s+lg:top-4\s+lg:self-start/,
    "right rail must stick while the main content scrolls",
  );
});

test("PageWithRightColumn is a server component (no 'use client')", () => {
  const src = read("src/components/ads/page-with-right-column.tsx");
  assert.ok(
    !/^\s*["']use client["']/m.test(src),
    "wrapper must be a server component so the house fallback hydrates without flicker",
  );
});

test("HouseFallback is a server component (no 'use client')", () => {
  const src = read("src/components/ads/house-fallback.tsx");
  assert.ok(
    !/^\s*["']use client["']/m.test(src),
    "house fallback must be a server component",
  );
});

test("HouseFallback omits the 'Sponsored' label", () => {
  const src = read("src/components/ads/house-fallback.tsx");
  assert.ok(
    !/Sponsored/.test(src),
    "house creatives must not carry the Sponsored label",
  );
});

// ============================================================
// House fallback daily rotation
// ============================================================

test("pickDailyNudge uses the daily rotation key (floor(now / 86_400_000))", () => {
  // Pin a single day: any time within the same UTC day → same nudge.
  const day0Start = 86_400_000 * 19_500; // arbitrary past UTC midnight
  const day0Mid = day0Start + 60 * 60 * 1000;
  const day1Start = day0Start + 86_400_000;
  for (const v of ["member", "guest"] as HouseVariant[]) {
    const a = pickDailyNudge(v, day0Start);
    const b = pickDailyNudge(v, day0Mid);
    assert.equal(a.title, b.title, `${v} nudge must be stable within a day`);
    const c = pickDailyNudge(v, day1Start);
    const idxA = HOUSE_NUDGES[v].findIndex((n) => n.title === a.title);
    const idxC = HOUSE_NUDGES[v].findIndex((n) => n.title === c.title);
    assert.equal(
      (idxA + 1) % HOUSE_NUDGES[v].length,
      idxC,
      `${v} nudge must advance by exactly 1 across a 24h boundary`,
    );
  }
});

test("HouseFallback source uses the documented modulo-day pattern", () => {
  const src = read("src/components/ads/house-fallback-data.ts");
  assert.match(
    src,
    /Math\.floor\(\s*now\s*\/\s*86_?400_?000\s*\)\s*%/,
    "rotation key must literally be Math.floor(now / 86_400_000) % poolSize",
  );
});

test("Each house variant has 3-5 nudges with required fields and resolvable hrefs", () => {
  const ROUTE_FILES: Record<string, string> = {
    "/dashboard": "src/app/dashboard/page.tsx",
    "/dashboard/business": "src/app/dashboard/business/page.tsx",
    "/dashboard/benefits": "src/app/dashboard/benefits/page.tsx",
    "/dashboard/profile": "src/app/dashboard/profile/page.tsx",
    "/dashboard/registration": "src/app/dashboard/registration/page.tsx",
    "/directory": "src/app/directory/page.tsx",
    "/expo": "src/app/expo/page.tsx",
    "/expo/register": "src/app/expo/register/page.tsx",
    "/membership": "src/app/membership/page.tsx",
    "/membership/apply": "src/app/membership/apply/page.tsx",
    "/about": "src/app/about/page.tsx",
    "/contact": "src/app/contact/page.tsx",
  };
  for (const [variant, pool] of Object.entries(HOUSE_NUDGES)) {
    assert.ok(
      pool.length >= 3 && pool.length <= 5,
      `${variant} should have 3-5 nudges, got ${pool.length}`,
    );
    for (const n of pool) {
      assert.ok(n.title && n.body && n.cta && n.href, `nudge missing fields`);
      if (n.href.startsWith("/")) {
        const file = ROUTE_FILES[n.href];
        assert.ok(file, `nudge href ${n.href} has no known route file`);
        // Throws if the file doesn't exist.
        read(file);
      } else {
        assert.match(
          n.href,
          /^mailto:|^https?:\/\//,
          `nudge href must be a route, mailto:, or absolute URL — got ${n.href}`,
        );
      }
    }
  }
});

// ============================================================
// Placement registry
// ============================================================

test("AD_PLACEMENTS includes legacy + new right-column keys", () => {
  // Legacy (pre-existing campaigns may target these).
  assert.equal(AD_PLACEMENTS.dashboardTop, "asi_dashboard_top");
  assert.equal(AD_PLACEMENTS.sidebar, "asi_sidebar");
  assert.equal(AD_PLACEMENTS.directoryInline, "asi_directory_inline");
  assert.equal(AD_PLACEMENTS.expoBanner, "asi_expo_banner");
  // New per-page right-rail keys following the Cayworks naming spec.
  assert.equal(
    AD_PLACEMENTS.memberDashboardRight,
    "asicayman_member_dashboard_right",
  );
  assert.equal(
    AD_PLACEMENTS.guestDirectoryRight,
    "asicayman_guest_directory_right",
  );
});

test("All new placement keys follow <platform>_<audience>_<page>_<position>", () => {
  const newKeys: string[] = [
    AD_PLACEMENTS.memberDashboardRight,
    AD_PLACEMENTS.guestDirectoryRight,
  ];
  for (const v of newKeys) {
    assert.match(
      v,
      /^asicayman_(member|guest|exhibitor|admin)_[a-z0-9_]+_(right|top|bottom|inline|hero)$/,
      `placement ${v} does not match the naming convention`,
    );
  }
});

// ============================================================
// AdSlot rotation
// ============================================================

test("AdSlot rotates at 15 seconds, with optional override", () => {
  const src = read("src/components/ads/ad-slot.tsx");
  assert.match(
    src,
    /AD_ROTATION_INTERVAL_MS\s*=\s*15_?000/,
    "default rotation interval must be 15000 ms",
  );
  assert.match(
    src,
    /rotationMs\?:\s*number/,
    "rotationMs prop must be optional and typed as number",
  );
  assert.match(
    src,
    /setInterval\([^,]+,\s*rotationMs\s*\)/,
    "rotation must drive the interval at rotationMs",
  );
  assert.match(
    src,
    /clearInterval\(intervalId\)/,
    "rotation must clean up its interval on unmount / dep change",
  );
});

test("AdSlot skips rotation fetches while document.hidden", () => {
  const src = read("src/components/ads/ad-slot.tsx");
  assert.match(
    src,
    /document\.hidden/,
    "rotation must guard against backgrounded tabs",
  );
});

test("AdSlot resets the impression sentinel only when adId changes", () => {
  const src = read("src/components/ads/ad-slot.tsx");
  // Same adId → return without touching state or sentinel.
  assert.match(
    src,
    /currentAdIdRef\.current\s*===\s*next\.adId\)\s*return/,
    "same adId branch must short-circuit without resetting the sentinel",
  );
  // Different adId → reset sentinel then commit new ad.
  assert.match(
    src,
    /currentAdIdRef\.current\s*=\s*next\.adId;\s*impressionSent\.current\s*=\s*false;\s*setAd\(next\)/,
    "different adId branch must update ref, reset sentinel, and setAd in order",
  );
});

// ============================================================
// Page inclusion / exclusion (Tier 1: paid placement)
// ============================================================

const WRAPPER_IMPORT =
  /from\s+["']@\/components\/ads\/page-with-right-column["']/;

test("/dashboard wraps with PageWithRightColumn + memberDashboardRight", () => {
  const src = read("src/app/dashboard/page.tsx");
  assert.match(src, WRAPPER_IMPORT);
  assert.match(
    src,
    /AD_PLACEMENTS\.memberDashboardRight/,
    "/dashboard must target the member dashboard placement",
  );
  assert.match(
    src,
    /fallbackVariant=["']member["']/,
    "/dashboard must use the member fallback variant",
  );
});

test("/directory wraps with PageWithRightColumn + guestDirectoryRight", () => {
  const src = read("src/app/directory/page.tsx");
  assert.match(src, WRAPPER_IMPORT);
  assert.match(
    src,
    /AD_PLACEMENTS\.guestDirectoryRight/,
    "/directory must target the guest directory placement",
  );
  assert.match(
    src,
    /fallbackVariant=["']guest["']/,
    "/directory must use the guest fallback variant",
  );
  assert.ok(
    !/import\s*\{[^}]*\bNativeAd\b[^}]*\}\s*from\s*["']@\/components\/ads\/variants["']/.test(
      src,
    ),
    "/directory's inline NativeAd is replaced by the right-rail wrapper",
  );
});

// ============================================================
// Sensitive page exclusions (negative assertions — lock these in)
// ============================================================

test("Sensitive pages do NOT import PageWithRightColumn", () => {
  const EXCLUDED = [
    // Auth — focus matters
    "src/app/auth/signin/page.tsx",
    "src/app/auth/signup/page.tsx",
    // Payment-adjacent — never put ads near a money flow
    "src/app/expo/register/page.tsx",
    "src/app/dashboard/registration/page.tsx",
    // Account settings / composer
    "src/app/dashboard/profile/page.tsx",
    "src/app/dashboard/business/page.tsx",
    // Onboarding wizard
    "src/app/membership/apply/page.tsx",
    // Admin tools (different audience context)
    "src/app/admin/page.tsx",
    "src/app/admin/settings/page.tsx",
    "src/app/admin/members/page.tsx",
    "src/app/admin/listings/page.tsx",
    "src/app/admin/registrations/page.tsx",
    "src/app/admin/receipts/page.tsx",
    "src/app/admin/announcements/page.tsx",
    "src/app/admin/ads-test/page.tsx",
  ];
  for (const file of EXCLUDED) {
    const src = read(file);
    assert.ok(
      !WRAPPER_IMPORT.test(src),
      `${file} must NOT import PageWithRightColumn (sensitive / excluded page)`,
    );
  }
});

// ============================================================
// Settings status panel
// ============================================================

test("/admin/settings exposes the ad placement status panel", () => {
  const src = read("src/app/admin/settings/page.tsx");
  assert.match(src, /AD_PLACEMENTS/, "settings page must list placements");
  assert.match(
    src,
    /\/admin\/ads-test/,
    "settings page must link to the ad engine test",
  );
});
