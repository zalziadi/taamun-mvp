"use client";

import Link from "next/link";
import type { NextAction } from "@/lib/nextStep";
import type { PatternType } from "@/lib/patterns/userPattern";

interface Props {
  actions: NextAction[];
  title?: string;
  // V7: Pattern-aware adaptation
  patternType?: PatternType | null;
  onActionClick?: (action: NextAction) => void;
}

/**
 * Renders 1-3 next-step actions to prevent dead ends.
 * Primary action is emphasized; alternatives shown as secondary buttons.
 *
 * V7: Pattern adaptation
 * - Avoidant: ONLY primary, larger, no alternatives shown
 * - Decisive: All alternatives, equal weight
 * - Default: Primary highlighted + alternatives
 */
export default function NextStepPanel({ actions, title, patternType, onActionClick }: Props) {
  if (!actions || actions.length === 0) return null;

  const primary = actions[0];
  // V7: Avoidant users see ONLY the primary (no alternatives)
  const alternatives = patternType === "avoidant" ? [] : actions.slice(1);
  const isAvoidant = patternType === "avoidant";

  // Adaptive title
  const displayTitle = title ?? (
    isAvoidant ? "خطوتك القادمة" : "وش بعد؟"
  );

  return (
    <section className={[
      "tm-card border-[#c4a265]/40 bg-gradient-to-b from-[#f4ead7]/40 to-transparent p-6 sm:p-7 space-y-4",
      isAvoidant && "border-2 shadow-[0_8px_24px_rgba(196,162,101,0.15)]",
    ].filter(Boolean).join(" ")}>
      <div>
        <p className="text-xs text-[#C9A84C] tracking-[0.2em]">{displayTitle}</p>
        {primary.reason && (
          <p className="mt-1 text-sm text-[#A8A29A]/85">{primary.reason}</p>
        )}
      </div>

      {/* Primary action — V7: larger for avoidant */}
      <Link
        href={primary.route}
        onClick={() => onActionClick?.(primary)}
        className={isAvoidant
          ? "tm-gold-btn inline-flex w-full items-center justify-center rounded-2xl px-8 py-4 text-lg font-bold"
          : "tm-gold-btn inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold sm:w-auto"
        }
      >
        ✦ {primary.label}
      </Link>

      {/* Alternatives — hidden for avoidant users */}
      {alternatives.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {alternatives.map((action, i) => (
            <Link
              key={`${action.type}-${i}`}
              href={action.route}
              onClick={() => onActionClick?.(action)}
              className="rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-4 py-2 text-sm text-[#A8A29A] transition-colors hover:border-[#C9A84C]/40 hover:bg-[#f9f3e7]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
