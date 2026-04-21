"use client";

interface Props {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * Pure-SVG sparkline. No external library. Returns null when there's
 * not enough data to draw a line (< 2 points).
 *
 * Y-axis is auto-scaled to the min/max of the provided series, plus a
 * small padding so flat lines don't render on the top/bottom edge.
 */
export function Sparkline({
  values,
  width = 120,
  height = 28,
  className,
  ...rest
}: Props) {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padY = 2;
  const innerH = height - padY * 2;

  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = padY + innerH - ((v - min) / range) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={rest["aria-label"] ?? `sparkline of ${values.length} points`}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
