import { CHART_COLORS } from "./colors";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Fill area below the line with a translucent tint of the stroke colour. */
  filled?: boolean;
  ariaLabel?: string;
}

/**
 * Tiny inline trend line. No axes, no labels — meant to sit next to a
 * single number (e.g. on a stat card) to hint at the recent trajectory.
 * Server-renderable SVG.
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = CHART_COLORS.pendingDeep,
  filled = false,
  ariaLabel,
}: SparklineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const coords = data.map((v, i) => {
    const x = i * stepX;
    // Inset by 1px top/bottom so the stroke isn't clipped.
    const y = height - 1 - ((v - min) / range) * (height - 2);
    return [x, y] as const;
  });
  const linePoints = coords.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaPoints =
    `0,${height} ${linePoints} ${width.toFixed(2)},${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      className="overflow-visible"
    >
      {filled && (
        <polygon points={areaPoints} fill={color} fillOpacity={0.12} stroke="none" />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePoints}
      />
    </svg>
  );
}
