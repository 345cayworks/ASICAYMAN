import type { MembershipType } from "@prisma/client";

export type MembershipCategory =
  | "BUSINESS_UNDER_10"
  | "BUSINESS_10_PLUS"
  | "PROFESSIONAL"
  | "SELF_SUPPORTING_MINISTRY";

export const MEMBERSHIP_CATEGORIES: {
  value: MembershipCategory;
  label: string;
  feeKyd: number;
  /** Mapped onto the internal MembershipType enum used elsewhere. */
  type: MembershipType;
}[] = [
  { value: "BUSINESS_UNDER_10", label: "Business owner — under 10 employees", feeKyd: 100, type: "BUSINESS" },
  { value: "BUSINESS_10_PLUS", label: "Business owner — 10 and over employees", feeKyd: 150, type: "BUSINESS" },
  { value: "PROFESSIONAL", label: "Professional member", feeKyd: 50, type: "INDIVIDUAL" },
  { value: "SELF_SUPPORTING_MINISTRY", label: "Self-supporting ministry", feeKyd: 50, type: "INDIVIDUAL" },
];

export function getMembershipCategory(value: string) {
  return MEMBERSHIP_CATEGORIES.find((c) => c.value === value);
}

export function formatKyd(amount: number): string {
  return `CI$${amount}`;
}
