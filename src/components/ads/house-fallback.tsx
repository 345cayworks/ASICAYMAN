import { SITE } from "@/lib/utils";
import {
  pickDailyNudge,
  type HouseVariant,
} from "./house-fallback-data";

// Server component. No client hooks, no random — daily deterministic
// rotation so the right rail is never empty and never flickers.
// Visual matches the paid sidebar card (same shell, padding, type scale)
// so the eye doesn't notice the transition between paid and house
// creatives. House cards intentionally carry no paid-ad label — only
// real ad-engine creatives get one.
export function HouseFallback({ variant }: { variant: HouseVariant }) {
  const nudge = pickDailyNudge(variant);
  return (
    <a
      href={nudge.href}
      className="card relative block overflow-hidden hover:border-[color:var(--color-navy-300)] transition-colors w-full min-w-0 max-w-full"
    >
      <div className="p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-gold-600)] font-semibold">
          {SITE.name}
        </p>
        <p className="mt-2 font-display text-base">{nudge.title}</p>
        <p className="mt-1.5 text-sm text-[color:var(--color-navy-700)] leading-relaxed line-clamp-3">
          {nudge.body}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-gold-700)]">
          {nudge.cta} →
        </span>
      </div>
    </a>
  );
}
