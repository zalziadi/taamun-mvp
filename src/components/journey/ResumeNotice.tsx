"use client";

import Link from "next/link";
import type { ReconciliationMessage } from "@/lib/journey/continuity";

interface Props {
  reconciliation: ReconciliationMessage;
  /** Visual variant — defaults to "parchment". */
  variant?: "parchment" | "dark";
}

/**
 * ResumeNotice — the banner that appears when the URL disagrees with
 * the user's state. This is the component that makes the system feel
 * like a continuous journey, not a random folder of pages.
 *
 * Behavior:
 *   - If `reconciliation.visible` is false, renders nothing.
 *   - If `reconciliation.blocking` is true, the UI should use the
 *     consumer's own blocking logic; this component still renders
 *     but the parent page should hide the main content.
 */
export function ResumeNotice({ reconciliation, variant = "parchment" }: Props) {
  if (!reconciliation.visible) return null;

  const isDark = variant === "dark";
  const { message, sublabel, cta, blocking } = reconciliation;

  const containerClass = isDark
    ? `rounded-2xl border border-[#c9b88a]/30 ${blocking ? "bg-[#15130f]" : "bg-white/5"} p-6 space-y-3`
    : `tm-card ${blocking ? "border-[#c4a265]/50 bg-gradient-to-b from-[#faf4e4] to-[#fcfaf7]" : "border-[#c4a265]/30 bg-[#faf6ee]"} p-6 space-y-3`;

  const labelClass = isDark
    ? "text-xs tracking-[0.18em] text-[#c9b88a]/80"
    : "text-xs tracking-[0.18em] text-[#8c7851]/80";

  const messageClass = isDark
    ? "text-base leading-[1.9] text-[#e8e1d9] font-semibold"
    : "text-base leading-[1.9] text-[#2f2619] font-semibold";

  const sublabelClass = isDark
    ? "text-sm leading-[1.9] text-[#c9b88a]/85 italic"
    : "text-sm leading-[1.9] text-[#5f5648]/85 italic";

  const ctaClass = isDark
    ? "inline-block rounded-xl bg-[#c9b88a] px-5 py-2.5 text-sm font-semibold text-[#15130f] hover:opacity-90 transition-opacity"
    : "tm-gold-btn inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold";

  return (
    <section className={containerClass}>
      <div className="flex items-center gap-2">
        <span className={labelClass}>
          {blocking ? "لحظة مصالحة" : "ملاحظة رحلة"}
        </span>
        <span className={isDark ? "text-[#c9b88a]" : "text-[#c4a265]"}>✦</span>
      </div>

      <p className={messageClass}>{message}</p>
      <p className={sublabelClass}>{sublabel}</p>

      {cta && (
        <div className="pt-1">
          <Link href={cta.route} className={ctaClass}>
            ← {cta.label}
          </Link>
        </div>
      )}
    </section>
  );
}
