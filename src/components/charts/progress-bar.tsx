import { CHART_COLORS } from "./colors";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  hint?: string;
  /** Larger version for hero metrics; default is 6px tall. */
  size?: "sm" | "md";
  ariaLabel?: string;
}

/**
 * Horizontal progress bar. Good for completeness / capacity / single-metric
 * fills (e.g. profile completion). Pure CSS, server-renderable.
 */
export function ProgressBar({
  value,
  max = 100,
  color,
  label,
  hint,
  size = "sm",
  ariaLabel,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const trackClass = size === "md" ? "h-2.5" : "h-1.5";
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-label={ariaLabel ?? label}>
      {(label || hint) && (
        <div className="flex items-baseline justify-between gap-3 text-xs mb-1.5">
          {label && (
            <span className="text-[color:var(--color-navy-700)] font-medium truncate">
              {label}
            </span>
          )}
          {hint && (
            <span className="text-[color:var(--color-navy-600)] tabular-nums shrink-0">
              {hint}
            </span>
          )}
        </div>
      )}
      <div
        className={`${trackClass} rounded-full bg-[color:var(--color-navy-100)] overflow-hidden`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color ?? CHART_COLORS.pending,
          }}
        />
      </div>
    </div>
  );
}
