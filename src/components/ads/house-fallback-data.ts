// In-house marketing nudges shown in the right rail when the Cayworks Ad
// Engine has no paid inventory for the placement (or when the page wraps
// without a placement at all). One nudge per day per variant — deterministic
// daily rotation so the column is never empty and never random.
//
// Hrefs prefer same-origin app routes; mailto: links are reserved for future
// revenue partnerships (e.g. an insurance referral).

export type HouseVariant = "member" | "guest";

export interface HouseNudge {
  title: string;
  body: string;
  cta: string;
  href: string;
}

// 5 nudges per variant — keep evergreen. Anything timely should run as a
// real campaign in the ad engine, not live here.
export const HOUSE_NUDGES: Record<HouseVariant, readonly HouseNudge[]> = {
  member: [
    {
      title: "List your business in the directory",
      body: "Approved listings show up in the public Adventist Business Community directory — add yours in a few minutes.",
      cta: "Add your business",
      href: "/dashboard/business",
    },
    {
      title: "Browse your member benefits",
      body: "Discounts, services, and partner offers added throughout the year.",
      cta: "See benefits",
      href: "/dashboard/benefits",
    },
    {
      title: "See your listing in the public directory",
      body: "How members of the public discover your business when they search the community.",
      cta: "Open the directory",
      href: "/directory",
    },
    {
      title: "Complete your profile",
      body: "A photo, short bio, and church affiliation make your profile easier to recognise.",
      cta: "Edit profile",
      href: "/dashboard/profile",
    },
  ],
  guest: [
    {
      title: "Join the Adventist Business Community",
      body: "Join Adventist business owners, professionals, and entrepreneurs across the Cayman Islands.",
      cta: "Apply for membership",
      href: "/membership/apply",
    },
    {
      title: "Browse the community directory",
      body: "Discover trusted Adventist-owned businesses, professionals, and services across the Cayman Islands.",
      cta: "Open directory",
      href: "/directory",
    },
    {
      title: "About the community",
      body: "How the Adventist Business Community connects business owners and the public they serve.",
      cta: "Learn more",
      href: "/about",
    },
    {
      title: "Have a question?",
      body: "We'd love to hear from you. Reach the team about membership, listings, or partnerships.",
      cta: "Get in touch",
      href: "/contact",
    },
  ],
} as const;

// Pure helper, exported for testing. Pick the nudge for `today` deterministically.
// Same nudge for every render within a 24h UTC window.
export function pickDailyNudge(
  variant: HouseVariant,
  now: number = Date.now(),
): HouseNudge {
  const pool = HOUSE_NUDGES[variant];
  const dayIndex = Math.floor(now / 86_400_000) % pool.length;
  return pool[dayIndex];
}
