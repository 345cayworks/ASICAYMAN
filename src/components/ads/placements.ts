// Placement keys registered for this platform in the Cayworks Ad Engine.
// These are NOT secret (the secret is AD_ENGINE_KEY, injected server-side).
//
// Naming convention for new per-page right-rail keys (Cayworks spec):
//   <platform-slug>_<audience>_<page-context>_<position>
// Legacy keys (`asi_*`) predate the convention; left in place so existing
// engine campaigns keep resolving.
export const AD_PLACEMENTS = {
  // Legacy / hero / sidebar placements
  dashboardTop: "asi_dashboard_top",
  sidebar: "asi_sidebar",
  directoryInline: "asi_directory_inline",
  expoBanner: "asi_expo_banner",

  // Per-page right-column placements (new wrapper)
  memberDashboardRight: "asicayman_member_dashboard_right",
  guestDirectoryRight: "asicayman_guest_directory_right",
} as const;

export type AdPlacementKey = keyof typeof AD_PLACEMENTS;
export type AdPlacementValue = (typeof AD_PLACEMENTS)[AdPlacementKey];

export type AdVariant = "banner" | "card" | "native";

// Manifest pushed to the ad engine by `npm run ads:sync` (Option B). The
// `type` reflects how each slot is rendered so the engine can dimension-fit
// creatives; these mirror the keys above. Keep this in sync when adding a
// placement so the engine's AdPlacement rows match what the app exposes.
import type { PlacementManifestEntry } from "@/lib/ad-engine";

export const PLACEMENT_MANIFEST: PlacementManifestEntry[] = [
  { key: AD_PLACEMENTS.dashboardTop, name: "Member Dashboard — Top Banner", type: "BANNER" },
  { key: AD_PLACEMENTS.sidebar, name: "Portal Sidebar", type: "SIDEBAR" },
  { key: AD_PLACEMENTS.directoryInline, name: "Directory — Inline Native", type: "NATIVE" },
  { key: AD_PLACEMENTS.expoBanner, name: "Expo — Banner", type: "BANNER" },
  { key: AD_PLACEMENTS.memberDashboardRight, name: "Member Dashboard — Right Column", type: "SIDEBAR" },
  { key: AD_PLACEMENTS.guestDirectoryRight, name: "Guest Directory — Right Column", type: "SIDEBAR" },
];
