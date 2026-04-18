/**
 * src/components/badges/MilestoneBadge.tsx
 *
 * Pure presentational SVG badge component — Day-28 variant ONLY for Phase 7.
 * Phase 8 will widen the `BadgeCode` union to include
 * day_1 / day_3 / day_7 / day_14 / day_21 / cycle_complete.
 *
 * RTL correctness (PITFALLS.md #8): this component renders Arabic glyphs ONLY
 * as sibling HTML span elements. The SVG body is purely geometric and
 * contains zero text nodes with Arabic characters. Arabic glyphs inside an
 * SVG text node can break glyph-joining at engine boundaries; HTML siblings
 * do not.
 *
 * Tone (RETURN-05 + BADGE-04 + 07-CONTEXT.md):
 *   - Badge name uses classical Arabic register (عتبة = threshold).
 *   - Phase 7 does not use English-loan vocabulary for milestones.
 *   - No animation, no framer-motion, no confetti.
 *   - No interactive handlers, no client-side fetch, no hooks.
 *
 * Privacy posture (carried from BADGE-04 into Phase 7):
 *   - Badges are private. This component exposes no export-card action,
 *     no og-image route, no sibling button for outbound broadcast.
 *
 * Layer discipline (CLAUDE.md):
 *   - src/components/* — UI only. No data fetching. No business logic.
 */

type BadgeCode = "day_28"; // Phase 8 will extend this union

export interface MilestoneBadgeProps {
  code: BadgeCode;
  unlocked: boolean;
  className?: string;
}

// Classical-Arabic copy — do not translate from English milestone vocabulary.
const BADGE_COPY: Record<BadgeCode, { name: string; numeral: string }> = {
  day_28: {
    name: "عتبة الثامن والعشرين",
    numeral: "٢٨", // Eastern-Arabic numeral — rendered in HTML span, never inside an SVG text node
  },
};

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
        Geometric SVG only — concentric circles + a subtle inner ring mark.
        Calm, timeless tone. No glow, no gradient, no animation. Stroke is
        a warm gold; background stays transparent so the host page palette
        shows through.
      */}
      <svg
        viewBox="0 0 120 120"
        width={96}
        height={96}
        role="img"
        aria-label={copy.name}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#C9A24B"
          strokeWidth="1.5"
        />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#C9A24B"
          strokeWidth="1"
          strokeOpacity="0.7"
        />
        <circle
          cx="60"
          cy="60"
          r="10"
          fill="none"
          stroke="#C9A24B"
          strokeWidth="1.25"
        />
        <line x1="60" y1="10" x2="60" y2="18" stroke="#C9A24B" strokeWidth="1" />
        <line x1="60" y1="102" x2="60" y2="110" stroke="#C9A24B" strokeWidth="1" />
        <line x1="10" y1="60" x2="18" y2="60" stroke="#C9A24B" strokeWidth="1" />
        <line x1="102" y1="60" x2="110" y2="60" stroke="#C9A24B" strokeWidth="1" />
      </svg>

      <span className="text-sm text-[#C9A24B]">{copy.name}</span>

      <span className="text-xs text-[#C9A24B]/70" aria-hidden="true">
        {copy.numeral}
      </span>
    </div>
  );
}
