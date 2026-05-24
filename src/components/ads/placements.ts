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
