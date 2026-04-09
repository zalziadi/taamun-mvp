"use client";

import { useState } from "react";
import Link from "next/link";
import type { WhyYouAreHere } from "@/lib/narrative/bridge";

interface Props {
  bridge: WhyYouAreHere;
  /** Visual variant — defaults to "parchment" matching /program and /city */
  variant?: "parchment" | "dark";
  /** Hide the "next step" CTA (e.g. on day page where the CTA is the day itself) */
  hideNext?: boolean;
  /** Optional override for the heading label above the summary */
  headingLabel?: string;
}

/**
 * WhyYouAreHereCard — the bridge card.
 *
 * Renders the three-line bridge (summary + transition + reasons) and an
 * optional "next step" CTA. The reasons list is hidden by default and
 * revealed with a toggle — so the card breathes rather than dumping data.
 *
 * This is the component that makes the user feel:
 *   "the system is walking with me, not tracking me"
 */
export function WhyYouAreHereCard({
  bridge,
  variant = "parchment",
  hideNext = false,
  headingLabel = "لماذا أنت هنا الآن",
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const isDark = variant === "dark";

  const containerClass = isDark
    ? "rounded-2xl border border-[#c9b88a]/30 bg-white/5 p-6 space-y-5"
    : "tm-card border-[#c4a265]/40 bg-gradient-to-b from-[#faf4e4] to-[#fcfaf7] p-6 space-y-5";

  const labelClass = isDark
    ? "text-[10px] tracking-[0.18em] text-[#c9b88a]/80"
    : "text-[10px] tracking-[0.18em] text-[#8c7851]/80";

  const summaryClass = isDark
    ? "text-base leading-[1.9] text-[#e8e1d9] font-semibold whitespace-pre-line"
    : "text-base leading-[1.9] text-[#2f2619] font-semibold whitespace-pre-line";

  const transitionClass = isDark
    ? "text-sm leading-[1.9] text-[#c9b88a] italic whitespace-pre-line"
    : "text-sm leading-[1.9] text-[#5f5648]/90 italic whitespace-pre-line";

  // The mirror — the direct line. Slightly stronger than the summary, no italic.
  const mirrorWrapperClass = isDark
    ? "rounded-xl border-r-2 border-[#c9b88a]/50 bg-[#c9b88a]/5 px-4 py-3"
    : "rounded-xl border-r-2 border-[#c4a265]/60 bg-[#f4ead7]/50 px-4 py-3";

  const mirrorTextClass = isDark
    ? "text-sm leading-[1.95] text-[#e8e1d9] whitespace-pre-line"
    : "text-sm leading-[1.95] text-[#3a2e1c] whitespace-pre-line";

  const reasonBoxClass = isDark
    ? "rounded-xl border border-white/10 bg-[#15130f]/50 p-3 space-y-1.5"
    : "rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] p-3 space-y-1.5";

  const reasonItemClass = isDark ? "text-xs text-[#c9b88a]/85" : "text-xs text-[#5f5648]/85";

  const ctaClass = isDark
    ? "inline-block rounded-xl bg-[#c9b88a] px-5 py-2.5 text-sm font-semibold text-[#15130f] hover:opacity-90 transition-opacity"
    : "tm-gold-btn inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold";

  const reasonReasonHintClass = isDark
    ? "text-[11px] text-[#c9b88a]/60"
    : "text-[11px] text-[#8c7851]/80";

  const toggleBtnClass = isDark
    ? "text-[11px] text-[#c9b88a]/70 hover:text-[#c9b88a] transition-colors"
    : "text-[11px] text-[#8c7851]/80 hover:text-[#5a4531] transition-colors";

  return (
    <section className={containerClass}>
      <div className="flex items-center gap-2">
        <span className={labelClass}>{headingLabel}</span>
        <span className={isDark ? "text-[#c9b88a]" : "text-[#c4a265]"}>✦</span>
      </div>

      <div className="space-y-3">
        <p className={summaryClass}>{bridge.summary}</p>
        <p className={transitionClass}>{bridge.transition}</p>
      </div>

      {bridge.reasons.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={toggleBtnClass}
            aria-expanded={expanded}
          >
            {expanded ? "إخفاء التفاصيل −" : "لماذا؟ +"}
          </button>

          {expanded && (
            <ul className={reasonBoxClass} aria-label="الإشارات التي أدّت إلى هذه اللحظة">
              {bridge.reasons.map((r, i) => (
                <li key={i} className={`${reasonItemClass} flex items-start gap-2`}>
                  <span className={isDark ? "text-[#c9b88a]/40" : "text-[#c4a265]/70"}>•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* The mirror — the direct truth. No toggle. Always visible. */}
      {bridge.mirror && (
        <div className={mirrorWrapperClass}>
          <p className={mirrorTextClass}>{bridge.mirror}</p>
        </div>
      )}

      {!hideNext && bridge.nextHint && (
        <div className="pt-1 space-y-1.5">
          <Link href={bridge.nextHint.route} className={ctaClass}>
            ← {bridge.nextHint.label}
          </Link>
          <p className={reasonReasonHintClass}>{bridge.nextHint.reason}</p>
        </div>
      )}
    </section>
  );
}
