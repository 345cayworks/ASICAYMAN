import type { ReactNode } from "react";
import { SponsoredCard } from "./variants";
import { HouseFallback } from "./house-fallback";
import type { HouseVariant } from "./house-fallback-data";

// Map house-fallback audience variant to the userRole the ad engine
// should target. Keeps paid campaigns from cross-targeting audiences
// (e.g. a MEMBER campaign rendering on a guest page).
const VARIANT_ROLE: Record<HouseVariant, string> = {
  member: "MEMBER",
  guest: "GUEST",
};

export interface PageWithRightColumnProps {
  children: ReactNode;
  /** When set, a paid SponsoredCard renders above the house fallback. */
  adPlacement?: string;
  /** Targeting hint to the ad engine. */
  adCategory?: string;
  /** Override the auto-derived userRole (defaults from fallbackVariant). */
  userRole?: string;
  /** Suppress the rotating in-house nudge. Default true. */
  showHouseFallback?: boolean;
  /** Audience for the house fallback + default userRole. */
  fallbackVariant?: HouseVariant;
  /** Slot above the paid ad (e.g. page-specific status panel). */
  rightColumnAbove?: ReactNode;
  /** Slot below the house fallback (e.g. helper links). */
  rightColumnBelow?: ReactNode;
}

/**
 * The Cayworks standard layout: main content + sticky 320px right rail.
 * Tablet and below stack the rail below the content. The rail renders in
 * order: rightColumnAbove → paid SponsoredCard (if any) → house fallback
 * → rightColumnBelow.
 *
 * Server component — keeps the house fallback flicker-free.
 */
export function PageWithRightColumn({
  children,
  adPlacement,
  adCategory,
  userRole,
  showHouseFallback = true,
  fallbackVariant = "guest",
  rightColumnAbove,
  rightColumnBelow,
}: PageWithRightColumnProps) {
  const resolvedRole = userRole ?? VARIANT_ROLE[fallbackVariant];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        {rightColumnAbove}
        {adPlacement && (
          <SponsoredCard
            placement={adPlacement}
            userRole={resolvedRole}
            category={adCategory}
          />
        )}
        {showHouseFallback && <HouseFallback variant={fallbackVariant} />}
        {rightColumnBelow}
      </aside>
    </div>
  );
}
