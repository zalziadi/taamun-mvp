"use client";

import Link from "next/link";
import type { PatternType } from "@/lib/patterns/userPattern";

interface Props {
  visible: boolean;
  reason?: string;
  variant?: "banner" | "card" | "compact";
  // V7: Pattern-aware adaptation
  patternType?: PatternType | null;
  onClick?: () => void;
}

/**
 * Decision CTA — appears when orchestrator.flowLock is enabled.
 * MUST be visible across pages (program, journey, city) when triggered.
 * Cannot be dismissed.
 */
// V7: Pattern-aware adaptive copy
function getAdaptiveCopy(patternType: PatternType | null | undefined) {
  if (patternType === "avoidant") {
    return {
      title: "خطوة واحدة فقط — لا أكثر",
      subtitle: "أنت تعرف الجواب. ما يلزم تحليل، يلزم خطوة",
      cta: "خذ الخطوة الآن",
    };
  }
  if (patternType === "decisive") {
    return {
      title: "وقت القرار",
      subtitle: "أنت سريع — هذا قرار يستحق دقيقة وعي إضافية",
      cta: "احسم القرار",
    };
  }
  if (patternType === "explorer") {
    return {
      title: "تأملاتك توصل لقرار",
      subtitle: "الفهم الذي بنيته يستحق فعل محدد الآن",
      cta: "حوّل الفهم لقرار",
    };
  }
  return {
    title: "وقت القرار — كل شيء آخر ينتظر",
    subtitle: "أنت الآن في لحظة تحوّل. الوضوح يأتي من القرار، ليس من التفكير",
    cta: "اتخذ القرار الآن",
  };
}

export default function DecisionCTA({ visible, reason, variant = "banner", patternType, onClick }: Props) {
  if (!visible) return null;

  const copy = getAdaptiveCopy(patternType);
  const isAvoidant = patternType === "avoidant";

  if (variant === "compact") {
    return (
      <Link
        href="/decision"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-xl border border-[#c4a265] bg-[#f4ead7] px-4 py-2 text-sm font-semibold text-[#5a4531] transition-all hover:scale-[1.02]"
      >
        🎯 {copy.title}
      </Link>
    );
  }

  if (variant === "card") {
    return (
      <section className={[
        "tm-card border-[#c4a265] bg-gradient-to-b from-[#f4ead7] to-[#faf6ee] p-5 sm:p-6 space-y-3",
        isAvoidant && "border-2 shadow-[0_12px_32px_rgba(196,162,101,0.25)]",
      ].filter(Boolean).join(" ")}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#2f2619]">{copy.title}</p>
            <p className="mt-1 text-xs text-[#5f5648]/85">{reason ?? copy.subtitle}</p>
          </div>
        </div>
        <Link
          href="/decision"
          onClick={onClick}
          className="tm-gold-btn inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold sm:w-auto"
        >
          {copy.cta}
        </Link>
      </section>
    );
  }

  // Default: banner — V7: avoidant gets larger + more dominant
  const bannerClass = isAvoidant
    ? "tm-card border-2 border-[#c4a265] bg-gradient-to-b from-[#f4ead7] to-[#faf6ee] p-7 sm:p-9 space-y-5 shadow-[0_16px_44px_rgba(196,162,101,0.28)]"
    : "tm-card border-2 border-[#c4a265] bg-gradient-to-b from-[#f4ead7] to-[#faf6ee] p-6 sm:p-7 space-y-4 shadow-[0_8px_28px_rgba(196,162,101,0.15)]";

  return (
    <section className={bannerClass}>
      <div className="text-center space-y-2">
        <p className={isAvoidant ? "text-4xl" : "text-3xl"}>🎯</p>
        <h2 className={isAvoidant
          ? "tm-heading text-3xl text-[#2f2619] sm:text-4xl"
          : "tm-heading text-2xl text-[#2f2619] sm:text-3xl"
        }>
          {copy.title}
        </h2>
        <p className="mx-auto max-w-[580px] text-sm leading-relaxed text-[#5f5648]/85">
          {reason ?? copy.subtitle}
        </p>
      </div>
      <div className="flex justify-center">
        <Link
          href="/decision"
          onClick={onClick}
          className={isAvoidant
            ? "tm-gold-btn rounded-2xl px-10 py-4 text-lg font-bold"
            : "tm-gold-btn rounded-2xl px-8 py-3 text-base font-semibold"
          }
        >
          {copy.cta}
        </Link>
      </div>
    </section>
  );
}
