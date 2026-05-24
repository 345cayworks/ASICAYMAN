import { CHART_COLORS } from "./colors";

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  size?: number;
  strokeWidth?: number;
  ariaLabel?: string;
  /** Optional centre overlay (e.g. total, or "12 active"). */
  centerLabel?: { value: string | number; sub?: string };
  emptyLabel?: string;
}

/**
 * SVG donut with a legend. Segments use `stroke-dasharray` on overlapping
 * circles — robust, no path math, scales cleanly. Server-renderable.
 */
export function DonutChart({
  data,
  size = 140,
  strokeWidth = 18,
  ariaLabel,
  centerLabel,
  emptyLabel = "No data yet",
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <div role="img" aria-label={ariaLabel} className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={CHART_COLORS.trackBg}
              strokeWidth={strokeWidth}
            />
          </svg>
          {centerLabel && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="font-display text-xl text-[color:var(--color-navy-400)] tabular-nums">
                0
              </div>
              {centerLabel.sub && (
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[color:var(--color-navy-500)]">
                  {centerLabel.sub}
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-[color:var(--color-navy-500)]">{emptyLabel}</p>
      </div>
    );
  }

  // Precompute dasharray + dashoffset so segments lay end-to-end without gaps.
  let offset = 0;
  const segments = data.map((d) => {
    const len = (d.value / total) * circumference;
    const seg = { color: d.color, len, offset };
    offset += len;
    return seg;
  });

  return (
    <div role="img" aria-label={ariaLabel} className="flex items-center gap-5 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={CHART_COLORS.trackBg}
            strokeWidth={strokeWidth}
          />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${s.len.toFixed(3)} ${(circumference - s.len).toFixed(3)}`}
              strokeDashoffset={(-s.offset).toFixed(3)}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="font-display text-2xl text-[color:var(--color-navy-900)] tabular-nums leading-none">
              {centerLabel.value}
            </div>
            {centerLabel.sub && (
              <div className="mt-1 text-[10px] uppercase tracking-wider text-[color:var(--color-navy-600)]">
                {centerLabel.sub}
              </div>
            )}
          </div>
        )}
      </div>
      <ul className="grid gap-2 text-sm min-w-0 flex-1">
        {data.map((d) => {
          const pct = Math.round((d.value / total) * 100);
          return (
            <li key={d.label} className="flex items-center gap-2.5">
              <span
                className="size-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: d.color }}
                aria-hidden
              />
              <span className="text-[color:var(--color-navy-800)] flex-1 min-w-0 truncate">
                {d.label}
              </span>
              <span className="text-xs text-[color:var(--color-navy-600)] tabular-nums shrink-0">
                {d.value}
                <span className="text-[color:var(--color-navy-400)] mx-1">·</span>
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
