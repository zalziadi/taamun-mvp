"use client";

import Link from "next/link";

interface Props {
  visible: boolean;
  reason?: string;
  variant?: "banner" | "card" | "compact";
}

/**
 * Decision CTA — appears when orchestrator.flowLock is enabled.
 * MUST be visible across pages (program, journey, city) when triggered.
 * Cannot be dismissed.
 */
export default function DecisionCTA({ visible, reason, variant = "banner" }: Props) {
  if (!visible) return null;

  if (variant === "compact") {
    return (
      <Link
        href="/decision"
        className="inline-flex items-center gap-2 rounded-xl border border-[#c4a265] bg-[#f4ead7] px-4 py-2 text-sm font-semibold text-[#5a4531] transition-all hover:scale-[1.02]"
      >
        🎯 وقت القرار
      </Link>
    );
  }

  if (variant === "card") {
    return (
      <section className="tm-card border-[#c4a265] bg-gradient-to-b from-[#f4ead7] to-[#faf6ee] p-5 sm:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#2f2619]">وقت القرار — كل شيء آخر ينتظر</p>
            <p className="mt-1 text-xs text-[#5f5648]/85">
              {reason ?? "أنت الآن في لحظة تحوّل. الوضوح يأتي من القرار، ليس من التفكير"}
            </p>
          </div>
        </div>
        <Link
          href="/decision"
          className="tm-gold-btn inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold sm:w-auto"
        >
          اتخذ القرار الآن
        </Link>
      </section>
    );
  }

  // Default: banner (large, prominent, top of page)
  return (
    <section className="tm-card border-2 border-[#c4a265] bg-gradient-to-b from-[#f4ead7] to-[#faf6ee] p-6 sm:p-7 space-y-4 shadow-[0_8px_28px_rgba(196,162,101,0.15)]">
      <div className="text-center space-y-2">
        <p className="text-3xl">🎯</p>
        <h2 className="tm-heading text-2xl text-[#2f2619] sm:text-3xl">
          وقت القرار — كل شيء آخر ينتظر
        </h2>
        <p className="mx-auto max-w-[580px] text-sm leading-relaxed text-[#5f5648]/85">
          {reason ?? "أنت الآن في لحظة تحوّل. الوضوح يأتي من القرار، ليس من التفكير"}
        </p>
      </div>
      <div className="flex justify-center">
        <Link
          href="/decision"
          className="tm-gold-btn rounded-2xl px-8 py-3 text-base font-semibold"
        >
          اتخذ القرار الآن
        </Link>
      </div>
    </section>
  );
}
