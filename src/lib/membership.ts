import type { MembershipType } from "@prisma/client";

export type MembershipCategory =
  | "BUSINESS_UNDER_10"
  | "BUSINESS_10_PLUS"
  | "PROFESSIONAL"
  | "SELF_SUPPORTING_MINISTRY";

// Membership is free and open — categories remain so the org can see at a
// glance who's joining (business size, professional, ministry). No fees.
export const MEMBERSHIP_CATEGORIES: {
  value: MembershipCategory;
  label: string;
  /** Mapped onto the internal MembershipType enum used elsewhere. */
  type: MembershipType;
}[] = [
  { value: "BUSINESS_UNDER_10", label: "Business owner — under 10 employees", type: "BUSINESS" },
  { value: "BUSINESS_10_PLUS", label: "Business owner — 10 and over employees", type: "BUSINESS" },
  { value: "PROFESSIONAL", label: "Professional member", type: "INDIVIDUAL" },
  { value: "SELF_SUPPORTING_MINISTRY", label: "Self-supporting ministry", type: "INDIVIDUAL" },
];

export function getMembershipCategory(value: string) {
  return MEMBERSHIP_CATEGORIES.find((c) => c.value === value);
}
