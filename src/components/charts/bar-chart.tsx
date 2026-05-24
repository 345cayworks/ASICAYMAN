import { CHART_COLORS } from "./colors";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  hint?: string;
}

interface HorizontalBarChartProps {
  data: BarDatum[];
  /** Override the auto-derived peak (e.g. when comparing across charts). */
  max?: number;
  formatValue?: (v: number) => string;
  ariaLabel?: string;
  emptyLabel?: string;
  /** `tabular-nums` on values — recommended for currency / aligned columns. */
  numeric?: boolean;
}

/**
 * Horizontal bar list — labelled rows with a value on the right. Best for
 * category breakdowns (status counts, top categories). Pure CSS, server-renderable.
 */
export function HorizontalBarChart({
  data,
  max,
  formatValue = (v) => String(v),
  ariaLabel,
  emptyLabel = "No data yet",
  numeric = false,
}: HorizontalBarChartProps) {
  const peak = max ?? Math.max(...data.map((d) => d.value), 0);
  if (!data.length || peak === 0) {
    return (
      <p className="text-sm text-[color:var(--color-navy-500)]">{emptyLabel}</p>
    );
  }
  return (
    <div role="img" aria-label={ariaLabel} className="grid gap-3">
      {data.map((d) => {
        const pct = (d.value / peak) * 100;
        return (
          <div key={d.label}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-[color:var(--color-navy-700)] truncate">
                {d.label}
              </span>
              <span
                className={`font-medium text-[color:var(--color-navy-900)] ${
                  numeric ? "tabular-nums" : ""
                }`}
              >
                {formatValue(d.value)}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-[color:var(--color-navy-100)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: d.color ?? CHART_COLORS.pending,
                }}
              />
            </div>
            {d.hint && (
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[color:var(--color-navy-500)]">
                {d.hint}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export interface VBarDatum {
  /** Tooltip / short label (e.g. "May 18"). */
  label: string;
  value: number;
}

interface VerticalBarChartProps {
  data: VBarDatum[];
  /** Total chart height in pixels. */
  height?: number;
  ariaLabel?: string;
  /** Bottom labels: first + last only, or off entirely. */
  axisLabels?: "endpoints" | "off";
  color?: string;
}

/**
 * Vertical bars — best for time-series snapshots (e.g. daily registrations
 * over a 14-day window). Pure CSS, equally weighted bars across the row.
 * Hover lifts each bar slightly via brightness — no per-bar JS needed.
 */
export function VerticalBarChart({
  data,
  height = 88,
  ariaLabel,
  axisLabels = "endpoints",
  color = CHART_COLORS.neutralDeep,
}: VerticalBarChartProps) {
  const peak = Math.max(...data.map((d) => d.value), 1);
  const empty = data.every((d) => d.value === 0);

  return (
    <div role="img" aria-label={ariaLabel}>
      <div
        className="flex items-end gap-1"
        style={{ height }}
        aria-hidden={empty}
      >
        {data.map((d, i) => {
          const pct = (d.value / peak) * 100;
          // Show a sliver for non-zero values so 1 isn't invisible.
          const shown = d.value > 0 ? Math.max(pct, 6) : 0;
          return (
            <div
              key={i}
              className="flex-1 min-w-0 flex flex-col justify-end h-full"
              title={`${d.label}: ${d.value}`}
            >
              <div
                className="w-full rounded-t-sm transition-[filter] hover:brightness-125"
                style={{
                  height: `${shown}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          );
        })}
      </div>
      {empty && (
        <p className="-mt-2 text-xs text-[color:var(--color-navy-500)]">
          No activity in this window.
        </p>
      )}
      {axisLabels === "endpoints" && data.length > 1 && (
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-[color:var(--color-navy-500)]">
          <span>{data[0]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      )}
    </div>
  );
}
