import type { YIRPublicStats } from "@/lib/yearInReview/types";

/**
 * Phase 11.05 — AwarenessTrajectory
 *
 * Hand-rolled SVG <polyline> sparkline. Zero chart library (YIR-11, NFR-08).
 *
 * Reads a pre-aggregated readonly number[] (weekly/monthly awareness averages)
 * from `YIRPublicStats.awareness_trajectory` and projects each point onto an
 * SVG viewport, normalizing so min→bottom, max→top.
 *
 * Privacy posture (YIR-08): imports ONLY `YIRPublicStats` (type-only). No
 * access to user-authored content. Plan 11.07 grep guard enforces.
 *
 * Tone (CONTEXT §R4): no animation, no ranking, no thresholds, no colors
 * beyond currentColor so the parent page palette governs.
 *
 * A11y (NFR-02): role="img" + Arabic aria-label.
 */
export function AwarenessTrajectory({
  trajectory,
  width = 320,
  height = 80,
}: {
  trajectory: YIRPublicStats["awareness_trajectory"];
  width?: number;
  height?: number;
}) {
  if (!trajectory || trajectory.length < 2) return null;

  const min = Math.min(...trajectory);
  const max = Math.max(...trajectory);
  const range = max - min || 1; // prevents divide-by-zero for constant series
  const stepX = width / (trajectory.length - 1);

  const points = trajectory
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="منحنى حضور وعيك خلال السنة"
      className="w-full h-20 text-[#C9A24B]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
