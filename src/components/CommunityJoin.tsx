"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

/**
 * CommunityJoin — دعوة للانضمام لمجتمع تمعّن على واتساب
 * يظهر للمشتركين فقط — مع إمكانية الإخفاء
 */

const WA_COMMUNITY_LINK =
  process.env.NEXT_PUBLIC_WA_COMMUNITY_LINK ||
  "https://chat.whatsapp.com/taamun-community";
const DISMISS_KEY = "taamun.community.dismissed";

export function CommunityJoin({ variant = "card" }: { variant?: "card" | "inline" }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DISMISS_KEY) === "true";
  });

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  function handleJoin() {
    track("community_join_clicked", { variant });
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">💬</span>
          <div>
            <p className="text-sm font-semibold text-[#14110F]">مجتمع المتمعّنين</p>
            <p className="text-xs text-[#A8A29A]/70">انضم لمجموعة واتساب — شارك تأملاتك واسمع غيرك</p>
          </div>
        </div>
        <a
          href={WA_COMMUNITY_LINK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleJoin}
          className="shrink-0 rounded-lg bg-[#25D366] px-4 py-2 text-xs font-bold text-white"
        >
          انضم
        </a>
      </div>
    );
  }

  return (
    <div className="tm-card p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10 text-xl">
            💬
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#14110F]">مجتمع المتمعّنين</h3>
            <p className="text-xs text-[#A8A29A]/70">مساحة آمنة لمشاركة التأملات والأسئلة</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-[#C9A84C]/40 hover:text-[#C9A84C]"
          aria-label="إخفاء دعوة المجتمع"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm text-[#A8A29A]/85">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-[#25D366]">◈</span>
          <span>شارك تأملاتك اليومية مع متمعّنين آخرين</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-[#25D366]">◈</span>
          <span>اسأل عن الآيات واسمع وجهات نظر مختلفة</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-[#25D366]">◈</span>
          <span>تحديات أسبوعية جماعية تحفّزك على الاستمرار</span>
        </div>
      </div>

      <a
        href={WA_COMMUNITY_LINK}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleJoin}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white transition-colors hover:bg-[#20BD5A]"
      >
        <span>انضم لمجتمع واتساب</span>
      </a>
    </div>
  );
}
