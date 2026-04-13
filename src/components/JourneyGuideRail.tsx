"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type GuideState = {
  title: string;
  hint: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

const STORAGE_KEY = "taamun_guide_rail_dismissed";

function getGuideState(pathname: string): GuideState {
  if (pathname.startsWith("/program/day/")) {
    return {
      title: "أكمل الخطوة",
      hint: "بعد صفحة اليوم، افتح التمعّن ثم راجع المرشد.",
      primaryHref: "/reflection",
      primaryLabel: "إلى التمعّن",
      secondaryHref: "/guide",
      secondaryLabel: "اسأل المرشد",
    };
  }

  if (pathname.startsWith("/reflection")) {
    return {
      title: "بعد التمعّن",
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
      secondaryLabel: "صفحة التمعّن",
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
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Read dismissed state on mount (default: closed)
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // If user explicitly opened it before, keep it closed by default anyway
      // The user wants it ONLY as popup when needed
      if (stored === "open") setOpen(true);
    } catch {
      // ignore
    }
  }, []);

  function handleOpen() {
    setOpen(true);
    try {
      localStorage.setItem(STORAGE_KEY, "open");
    } catch {}
  }

  function handleClose() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "closed");
    } catch {}
  }

  if (!mounted) return null;

  // ── Closed state: tiny floating button (compass icon) ──
  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        aria-label="افتح مرشد الرحلة"
        title="مرشد الرحلة"
        className="fixed bottom-20 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#c9b88a]/35 bg-[#1a1712]/95 text-[#c9b88a] shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur transition-all hover:scale-105 hover:bg-[#1a1712] md:bottom-6 md:left-6"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      </button>
    );
  }

  // ── Open state: full widget with close button ──
  return (
    <aside className="fixed bottom-20 left-4 z-40 w-[min(92vw,330px)] rounded-2xl border border-[#c9b88a]/35 bg-[#1a1712]/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur md:bottom-6 md:left-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs text-[#c9b88a]/90">{state.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#e8e1d9]/80">{state.hint}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="إغلاق مرشد الرحلة"
          className="-mt-1 -mr-1 flex h-7 w-7 items-center justify-center rounded-full text-[#c9b88a]/70 transition-colors hover:bg-[#c9b88a]/10 hover:text-[#c9b88a]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={state.primaryHref}
          onClick={handleClose}
          className="rounded-lg bg-[#c9b88a] px-3 py-1.5 text-xs font-semibold text-[#15130f] transition-opacity hover:opacity-90"
        >
          {state.primaryLabel}
        </Link>
        <Link
          href={state.secondaryHref}
          onClick={handleClose}
          className="rounded-lg border border-[#c9b88a]/35 px-3 py-1.5 text-xs text-[#e8e1d9] transition-colors hover:bg-[#c9b88a]/10"
        >
          {state.secondaryLabel}
        </Link>
        <Link
          href="/"
          onClick={handleClose}
          className="rounded-lg border border-[#d8cdb9]/35 px-3 py-1.5 text-xs text-[#e8e1d9]/85 transition-colors hover:bg-[#d8cdb9]/10"
        >
          الرئيسية
        </Link>
      </div>
    </aside>
  );
}
