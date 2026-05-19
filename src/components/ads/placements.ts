// Placement keys registered for this platform in the Cayworks Ad Engine.
// These are NOT secret (the secret is AD_ENGINE_KEY, injected server-side).
export const AD_PLACEMENTS = {
  dashboardTop: "asi_dashboard_top",
  sidebar: "asi_sidebar",
  directoryInline: "asi_directory_inline",
  expoBanner: "asi_expo_banner",
} as const;

export type AdVariant = "banner" | "card" | "native";
