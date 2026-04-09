"use client";

import { useState } from "react";
import type { DecisionExplanation } from "@/lib/narrative/decisionExplainer";

interface Props {
  explanation: DecisionExplanation;
  /** Visual variant — defaults to "parchment" */
  variant?: "parchment" | "dark";
  /** If true, opens expanded on first render */
  defaultOpen?: boolean;
}

/**
 * DecisionExplainer — expandable "why this step?" card.
 *
 * Appears under a CTA button. Collapsed by default so it doesn't add
 * visual weight. When opened, shows the one-line humanSentence first,
 * then the list of concrete signals that led here.
 */
export function DecisionExplainer({
  explanation,
  variant = "parchment",
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const isDark = variant === "dark";

  const triggerClass = isDark
    ? "text-[11px] text-[#c9b88a]/70 hover:text-[#c9b88a] transition-colors underline decoration-dotted underline-offset-4"
    : "text-[11px] text-[#8c7851]/80 hover:text-[#5a4531] transition-colors underline decoration-dotted underline-offset-4";

  const panelClass = isDark
    ? "mt-2 rounded-xl border border-white/10 bg-[#15130f]/50 p-3 space-y-2"
    : "mt-2 rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] p-3 space-y-2";

  const humanClass = isDark
    ? "text-xs text-[#e8e1d9] leading-relaxed"
    : "text-xs text-[#2f2619] leading-relaxed font-semibold";

  const listClass = isDark
    ? "text-[11px] text-[#c9b88a]/80 leading-relaxed"
    : "text-[11px] text-[#5f5648]/85 leading-relaxed";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-expanded={open}
      >
        {open ? `${explanation.title} −` : `${explanation.title} +`}
      </button>

      {open && (
        <div className={panelClass}>
          <p className={humanClass}>{explanation.humanSentence}</p>

          {explanation.reasons.length > 0 && (
            <ul className="space-y-1">
              {explanation.reasons.map((r, i) => (
                <li key={i} className={`${listClass} flex items-start gap-2`}>
                  <span className={isDark ? "text-[#c9b88a]/40" : "text-[#c4a265]/70"}>•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
