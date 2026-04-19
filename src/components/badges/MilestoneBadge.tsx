/**
 * src/components/badges/MilestoneBadge.tsx
 *
 * Pure presentational SVG badge component.
 * Phase 7 shipped the day_28 variant. Phase 8 widened this union to all
 * 7 variants: day_1 / day_3 / day_7 / day_14 / day_21 / day_28 / cycle_complete.
 *
 * RTL correctness (PITFALLS.md #8): this component renders Arabic glyphs ONLY
 * as sibling HTML span elements. The SVG body is purely geometric and
 * contains zero text nodes with Arabic characters. Arabic glyphs inside an
 * SVG text node can break glyph-joining at engine boundaries; HTML siblings
 * do not.
 *
 * Tone (RETURN-05 + BADGE-04 + 07-CONTEXT.md + 08-CONTEXT.md):
 *   - Badge name uses classical Arabic register (عتبة = threshold).
 *   - No English-loan vocabulary for milestones ("Unlocked!", "Achievement").
 *   - No animation, no framer-motion, no confetti.
 *   - No interactive handlers, no client-side fetch, no hooks.
 *
 * Privacy posture (BADGE-04):
 *   - Badges are private. This component exposes no export-card action,
 *     no og-image route, no sibling button for outbound broadcast.
 *
 * Layer discipline (CLAUDE.md):
 *   - src/components/* — UI only. No data fetching. No business logic.
 */

export type BadgeCode =
  | "day_1"
  | "day_3"
  | "day_7"
  | "day_14"
  | "day_21"
  | "day_28"
  | "cycle_complete";

export interface MilestoneBadgeProps {
  code: BadgeCode;
  unlocked: boolean;
  className?: string;
}

// Classical-Arabic copy — do not translate from English milestone vocabulary.
// Eastern-Arabic numerals rendered only inside HTML spans, never in SVG <text>.
const BADGE_COPY: Record<BadgeCode, { name: string; numeral: string }> = {
  day_1: { name: "عتبة البداية", numeral: "١" },
  day_3: { name: "عتبة الثلاث", numeral: "٣" },
  day_7: { name: "عتبة السبع", numeral: "٧" },
  day_14: { name: "عتبة الأربعة عشر", numeral: "١٤" },
  day_21: { name: "عتبة الواحد والعشرين", numeral: "٢١" },
  day_28: { name: "عتبة الثامن والعشرين", numeral: "٢٨" },
  cycle_complete: { name: "تمام الحلقة", numeral: "◯" },
};

const GOLD = "#C9A24B";

/**
 * Per-variant SVG body. All geometric — stroke-only, no fill, no gradient,
 * no glow, no animation. ViewBox 0 0 120 120 across every variant so the
 * wrapper <svg> stays byte-stable with Phase 7.
 *
 * The day_28 geometry is preserved EXACTLY from Phase 7 (concentric circles
 * r=54/42/10 + 4 cardinal ticks) so downstream consumers that already render
 * Day-28 badges see zero visual regression.
 */
function renderSvgBody(code: BadgeCode) {
  switch (code) {
    case "day_1": {
      // Single small centered circle + one top-cardinal tick = "بداية"
      return (
        <g>
          <circle
            cx="60"
            cy="60"
            r="10"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.25"
          />
          <line
            x1="60"
            y1="10"
            x2="60"
            y2="18"
            stroke={GOLD}
            strokeWidth="1"
          />
        </g>
      );
    }

    case "day_3": {
      // Equilateral triangle inscribed in outer circle + inner circle.
      // Vertices at top (90deg), bottom-left (210deg), bottom-right (330deg)
      // on a radius-54 circle, centered at (60, 60).
      // top       = (60, 60-54) = (60, 6)
      // bot-right = (60 + 54*cos(-30deg), 60 - 54*sin(-30deg))
      //           ≈ (60 + 46.77, 60 + 27)       = (106.77, 87)
      // bot-left  = (60 - 46.77, 60 + 27)       = (13.23, 87)
      return (
        <g>
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.5"
          />
          <polygon
            points="60,6 106.77,87 13.23,87"
            fill="none"
            stroke={GOLD}
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          <circle
            cx="60"
            cy="60"
            r="14"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.25"
          />
        </g>
      );
    }

    case "day_7": {
      // Outer circle + 7 radial ticks spaced at 360/7 deg.
      // Tick: from r=50 to r=58 outward. Start angle 0 = top.
      // For i in 0..6: angle = -90 + i * (360/7) degrees.
      // x_inner = 60 + 50*cos(theta), y_inner = 60 + 50*sin(theta)
      // x_outer = 60 + 58*cos(theta), y_outer = 60 + 58*sin(theta)
      const ticks = Array.from({ length: 7 }, (_, i) => {
        const deg = -90 + i * (360 / 7);
        const rad = (deg * Math.PI) / 180;
        const xi = 60 + 50 * Math.cos(rad);
        const yi = 60 + 50 * Math.sin(rad);
        const xo = 60 + 58 * Math.cos(rad);
        const yo = 60 + 58 * Math.sin(rad);
        return { xi, yi, xo, yo, key: i };
      });
      return (
        <g>
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.25"
          />
          {ticks.map((t) => (
            <line
              key={t.key}
              x1={t.xi.toFixed(2)}
              y1={t.yi.toFixed(2)}
              x2={t.xo.toFixed(2)}
              y2={t.yo.toFixed(2)}
              stroke={GOLD}
              strokeWidth="1"
            />
          ))}
        </g>
      );
    }

    case "day_14": {
      // Two concentric circles + 14 small dots around the inner ring.
      // Outer r=54, inner r=36. Dots on a r=44 arc, spaced 360/14 deg.
      const dots = Array.from({ length: 14 }, (_, i) => {
        const deg = -90 + i * (360 / 14);
        const rad = (deg * Math.PI) / 180;
        const cx = 60 + 44 * Math.cos(rad);
        const cy = 60 + 44 * Math.sin(rad);
        return { cx, cy, key: i };
      });
      return (
        <g>
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.5"
          />
          <circle
            cx="60"
            cy="60"
            r="36"
            fill="none"
            stroke={GOLD}
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          {dots.map((d) => (
            <circle
              key={d.key}
              cx={d.cx.toFixed(2)}
              cy={d.cy.toFixed(2)}
              r="1.2"
              fill="none"
              stroke={GOLD}
              strokeWidth="1"
            />
          ))}
        </g>
      );
    }

    case "day_21": {
      // 3 concentric circles + 7 radial ticks (3 × 7 = 21 visual cue).
      // Outer r=54, mid r=40, inner r=14. Ticks from r=54 to r=60.
      const ticks = Array.from({ length: 7 }, (_, i) => {
        const deg = -90 + i * (360 / 7);
        const rad = (deg * Math.PI) / 180;
        const xi = 60 + 54 * Math.cos(rad);
        const yi = 60 + 54 * Math.sin(rad);
        const xo = 60 + 60 * Math.cos(rad);
        const yo = 60 + 60 * Math.sin(rad);
        return { xi, yi, xo, yo, key: i };
      });
      return (
        <g>
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.5"
          />
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke={GOLD}
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          <circle
            cx="60"
            cy="60"
            r="14"
            fill="none"
            stroke={GOLD}
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          {ticks.map((t) => (
            <line
              key={t.key}
              x1={t.xi.toFixed(2)}
              y1={t.yi.toFixed(2)}
              x2={t.xo.toFixed(2)}
              y2={t.yo.toFixed(2)}
              stroke={GOLD}
              strokeWidth="1"
            />
          ))}
        </g>
      );
    }

    case "day_28": {
      // PRESERVED from Phase 7 — concentric circles r=54/42/10 + 4 cardinal
      // ticks. Byte-stable with the original Phase 7 implementation.
      return (
        <g>
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.5"
          />
          <circle
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke={GOLD}
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          <circle
            cx="60"
            cy="60"
            r="10"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.25"
          />
          <line
            x1="60"
            y1="10"
            x2="60"
            y2="18"
            stroke={GOLD}
            strokeWidth="1"
          />
          <line
            x1="60"
            y1="102"
            x2="60"
            y2="110"
            stroke={GOLD}
            strokeWidth="1"
          />
          <line
            x1="10"
            y1="60"
            x2="18"
            y2="60"
            stroke={GOLD}
            strokeWidth="1"
          />
          <line
            x1="102"
            y1="60"
            x2="110"
            y2="60"
            stroke={GOLD}
            strokeWidth="1"
          />
        </g>
      );
    }

    case "cycle_complete": {
      // Outer solid ring (r=54, strokeWidth=2) enclosing the day_28 inner
      // geometry = "closure around the full cycle".
      return (
        <g>
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={GOLD}
            strokeWidth="2"
          />
          <circle
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke={GOLD}
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          <circle
            cx="60"
            cy="60"
            r="10"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.25"
          />
          <line
            x1="60"
            y1="10"
            x2="60"
            y2="18"
            stroke={GOLD}
            strokeWidth="1"
          />
          <line
            x1="60"
            y1="102"
            x2="60"
            y2="110"
            stroke={GOLD}
            strokeWidth="1"
          />
          <line
            x1="10"
            y1="60"
            x2="18"
            y2="60"
            stroke={GOLD}
            strokeWidth="1"
          />
          <line
            x1="102"
            y1="60"
            x2="110"
            y2="60"
            stroke={GOLD}
            strokeWidth="1"
          />
        </g>
      );
    }
  }
}

export function MilestoneBadge({
  code,
  unlocked,
  className,
}: MilestoneBadgeProps) {
  const copy = BADGE_COPY[code];
  const dimClass = unlocked ? "" : "opacity-40 grayscale";
  const wrapperClass = [
    "inline-flex flex-col items-center gap-2",
    dimClass,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass} dir="rtl">
      {/*
        Geometric SVG only — per-variant motif. Calm, timeless tone.
        No glow, no gradient, no animation. Stroke is a warm gold;
        background stays transparent so the host page palette shows through.
      */}
      <svg
        viewBox="0 0 120 120"
        width={96}
        height={96}
        role="img"
        aria-label={copy.name}
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderSvgBody(code)}
      </svg>

      <span className="text-sm text-[#C9A24B]">{copy.name}</span>

      <span className="text-xs text-[#C9A24B]/70" aria-hidden="true">
        {copy.numeral}
      </span>
    </div>
  );
}
