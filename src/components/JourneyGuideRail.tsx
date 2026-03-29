"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type GuideState = {
  title: string;
  hint: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

function getGuideState(pathname: string): GuideState {
  if (pathname.startsWith("/program/day/")) {
    return {
      title: "أكمل الخطوة",
      hint: "بعد صفحة اليوم، افتح التأمل ثم راجع المرشد.",
      primaryHref: "/reflection",
      primaryLabel: "إلى التأمل",
      secondaryHref: "/guide",
      secondaryLabel: "اسأل المرشد",
    };
  }

  if (pathname.startsWith("/reflection")) {
    return {
      title: "بعد التأمل",
      hint: "حفظت الفكرة؟ انتقل للدفتر أو تابع يومك التالي.",
      primaryHref: "/journal",
      primaryLabel: "افتح الدفتر",
      secondaryHref: "/program",
      secondaryLabel: "مسار الرحلة",
    };
  }

  if (pathname.startsWith("/guide")) {
    return {
      title: "تطبيق التوجيه",
      hint: "حوّل نصيحة المرشد إلى تمرين عملي الآن.",
      primaryHref: "/reflection",
      primaryLabel: "تأمل الآن",
      secondaryHref: "/program",
      secondaryLabel: "متابعة الرحلة",
    };
  }

  if (pathname.startsWith("/journey")) {
    return {
      title: "تحرك للخطوة التالية",
      hint: "المشهد واضح. الآن طبّق في يومك الحالي.",
      primaryHref: "/program",
      primaryLabel: "افتح البرنامج",
      secondaryHref: "/reflection",
      secondaryLabel: "صفحة التأمل",
    };
  }

  if (pathname.startsWith("/account")) {
    return {
      title: "استمر في المسار",
      hint: "جاهز لخطوة جديدة؟ ارجع للبرنامج أو اسأل المرشد.",
      primaryHref: "/program",
      primaryLabel: "متابعة البرنامج",
      secondaryHref: "/guide",
      secondaryLabel: "المرشد الذكي",
    };
  }

  return {
    title: "مرشد الرحلة",
    hint: "اختر خطوتك القادمة بوضوح.",
    primaryHref: "/program",
    primaryLabel: "ابدأ/تابع البرنامج",
    secondaryHref: "/guide",
    secondaryLabel: "افتح المرشد",
  };
}

export function JourneyGuideRail() {
  const pathname = usePathname() || "/";
  const state = getGuideState(pathname);

  return (
    <aside className="fixed bottom-20 left-4 z-40 w-[min(92vw,330px)] rounded-2xl border border-[#c9b88a]/35 bg-[#1a1712]/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur md:bottom-6 md:left-6">
      <p className="text-[11px] text-[#c9b88a]/90">{state.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#e8e1d9]/80">{state.hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={state.primaryHref}
          className="rounded-lg bg-[#c9b88a] px-3 py-1.5 text-xs font-semibold text-[#15130f] transition-opacity hover:opacity-90"
        >
          {state.primaryLabel}
        </Link>
        <Link
          href={state.secondaryHref}
          className="rounded-lg border border-[#c9b88a]/35 px-3 py-1.5 text-xs text-[#e8e1d9] transition-colors hover:bg-[#c9b88a]/10"
        >
          {state.secondaryLabel}
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-[#d8cdb9]/35 px-3 py-1.5 text-xs text-[#e8e1d9]/85 transition-colors hover:bg-[#d8cdb9]/10"
        >
          الرئيسية
        </Link>
      </div>
    </aside>
  );
}
