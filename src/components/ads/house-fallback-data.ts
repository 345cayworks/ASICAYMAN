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
      body: "Approved listings show up in the public ASI Cayman directory — add yours in a few minutes.",
      cta: "Add your business",
      href: "/dashboard/business",
    },
    {
      title: "Register a booth at the Expo",
      body: "The ASI Cayman Business & Career Expo is June 28, 2026. Member pricing applies year-round.",
      cta: "Register a booth",
      href: "/expo/register",
    },
    {
      title: "Browse your member benefits",
      body: "Discounts, services, and partner offers added throughout the year.",
      cta: "See benefits",
      href: "/dashboard/benefits",
    },
    {
      title: "See your listing in the public directory",
      body: "How members of the community discover your business when they search.",
      cta: "Visit the directory",
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
      title: "Become an ASI Cayman member",
      body: "Join Adventist business owners, professionals, and entrepreneurs across the Cayman Islands.",
      cta: "Apply for membership",
      href: "/membership/apply",
    },
    {
      title: "Business & Career Expo 2026",
      body: "Free admission. Local Adventist-owned businesses, health screenings, career guidance and more.",
      cta: "Expo details",
      href: "/expo",
    },
    {
      title: "Browse the member directory",
      body: "Discover trusted businesses, professionals, and services run by members of our community.",
      cta: "Open directory",
      href: "/directory",
    },
    {
      title: "What is ASI Cayman?",
      body: "The Cayman Islands chapter of ASI — supporting Christ-centered outreach through business and ministry.",
      cta: "About ASI Cayman",
      href: "/about",
    },
    {
      title: "Have a question?",
      body: "We'd love to hear from you. Reach the ASI Cayman team about membership, the expo, or partnerships.",
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
