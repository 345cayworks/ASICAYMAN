/**
 * Expo pricing logic — server-authoritative.
 *
 * Rules (per brief):
 *   - ASI member        → $100
 *   - On or before 31 May 2026 (early-bird) → $100
 *   - Otherwise         → $150
 *
 * Amounts are stored in CENTS in the database. UI may convert to dollars.
 */

import type { Event } from "@prisma/client";

export interface PriceComputationInput {
  isAsiMember: boolean;
  now?: Date;
}

export interface PriceComputationResult {
  amount: number;          // cents
  amountDollars: number;   // for UI display
  earlyBirdApplied: boolean;
  memberDiscountApplied: boolean;
  reason: "MEMBER" | "EARLY_BIRD" | "REGULAR";
}

/**
 * Compute the price for an expo registration based on the event's pricing
 * configuration and the registrant's status. Always runs server-side before
 * persisting to the ExpoRegistration record.
 */
export function computeExpoPrice(
  event: Pick<Event, "memberPrice" | "regularPrice" | "earlyBirdPrice" | "earlyBirdUntil">,
  input: PriceComputationInput,
): PriceComputationResult {
  const now = input.now ?? new Date();
  const memberDiscount = input.isAsiMember;
  const earlyBird =
    !!event.earlyBirdUntil && now.getTime() <= event.earlyBirdUntil.getTime();

  if (memberDiscount) {
    return {
      amount: event.memberPrice,
      amountDollars: event.memberPrice / 100,
      earlyBirdApplied: false,
      memberDiscountApplied: true,
      reason: "MEMBER",
    };
  }

  if (earlyBird) {
    return {
      amount: event.earlyBirdPrice,
      amountDollars: event.earlyBirdPrice / 100,
      earlyBirdApplied: true,
      memberDiscountApplied: false,
      reason: "EARLY_BIRD",
    };
  }

  return {
    amount: event.regularPrice,
    amountDollars: event.regularPrice / 100,
    earlyBirdApplied: false,
    memberDiscountApplied: false,
    reason: "REGULAR",
  };
}

export function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD", // KYD pegged 1:1.2 to USD but expo brief lists USD-equivalent dollars
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
