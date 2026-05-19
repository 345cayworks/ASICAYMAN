"use client";

import { AdSlot, type AdSlotProps } from "./ad-slot";

type PresetProps = Omit<AdSlotProps, "variant">;

/** Wide image area (page headers, dashboard top). */
export function AdBanner(props: PresetProps) {
  return <AdSlot {...props} variant="banner" />;
}

/** List/detail sidebars and right rails. */
export function SponsoredCard(props: PresetProps) {
  return <AdSlot {...props} variant="card" />;
}

/** Inline within content/list flow. */
export function NativeAd(props: PresetProps) {
  return <AdSlot {...props} variant="native" />;
}
