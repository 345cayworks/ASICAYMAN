// Status colours mapped to the platform palette. Use these so every chart,
// badge, and legend across the admin reports speaks the same visual language.
//
// Tokens use the CSS custom properties from globals.css (which Tailwind 4
// resolves via @theme). Rejected/error has no token — uses the brick red
// already established in .badge-rejected.

export const CHART_COLORS = {
  // Success / completed
  success: "var(--color-teal-500)",
  successAlt: "var(--color-teal-400)",
  successDeep: "var(--color-teal-600)",

  // Warm / pending
  pending: "var(--color-gold-400)",
  pendingAlt: "var(--color-gold-300)",
  pendingDeep: "var(--color-gold-600)",

  // Neutral / informational
  neutral: "var(--color-navy-300)",
  neutralDeep: "var(--color-navy-700)",
  trackBg: "var(--color-navy-100)",

  // Error
  error: "rgb(153 27 27)",
  errorTint: "rgb(220 38 38 / 0.85)",
} as const;

// Semantic mapping for status enums. Keys match the strings stored in the DB
// (UserStatus, ListingStatus, PaymentStatus, ReceiptStatus).
export const STATUS_COLOR: Record<string, string> = {
  // UserStatus
  ACTIVE: CHART_COLORS.success,
  PENDING: CHART_COLORS.pending,
  SUSPENDED: CHART_COLORS.error,

  // ListingStatus / PaymentStatus / ReceiptStatus share APPROVED/REJECTED
  APPROVED: CHART_COLORS.success,
  REJECTED: CHART_COLORS.error,

  // PaymentStatus
  RECEIPT_UPLOADED: CHART_COLORS.pendingAlt,
  VERIFIED: CHART_COLORS.successAlt,
  PAID: CHART_COLORS.successDeep,
  REFUNDED: CHART_COLORS.neutral,

  // ReceiptStatus
  UPLOADED: CHART_COLORS.pendingAlt,
};

export function colorForStatus(status: string): string {
  return STATUS_COLOR[status] ?? CHART_COLORS.neutral;
}

export function prettifyStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
