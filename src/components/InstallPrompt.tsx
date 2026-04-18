"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * InstallPrompt — PWA install banner.
 * Shows on day 7+; re-prompts at day 28 if dismissed.
 *
 * Uses the `beforeinstallprompt` event (Chromium).
 * On iOS (no native prompt), falls back to a "كيف تثبّته" tip page link.
 */

const DISMISS_KEY = "taamun.install.dismissed";
const PROMPTED_AT_KEY = "taamun.install.promptedAt";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt({ currentDay }: { currentDay: number }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  const shouldShow = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (currentDay < 7) return false;

    // Already installed (standalone display mode)?
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return false;

    const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY) ?? "0", 10);
    if (!dismissedAt) return true;

    // Dismissed before — only re-prompt on day 28+
    const dismissedDayKey = "taamun.install.dismissedDay";
    const dismissedDay = parseInt(localStorage.getItem(dismissedDayKey) ?? "0", 10);
    if (currentDay >= 28 && dismissedDay < 28) return true;

    return false;
  }, [currentDay]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect iOS (no beforeinstallprompt support)
    const ua = window.navigator.userAgent;
    const iosDetected = /iPad|iPhone|iPod/.test(ua) && !/Android/.test(ua);
    setIsIos(iosDetected);

    if (!shouldShow()) return;

    // iOS: show tip immediately
    if (iosDetected) {
      setVisible(true);
      return;
    }

    // Android/Chromium: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
      localStorage.setItem(PROMPTED_AT_KEY, String(Date.now()));
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [shouldShow]);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1"); // never show again
    }
    setVisible(false);
    setDeferred(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    localStorage.setItem("taamun.install.dismissedDay", String(currentDay));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="تثبيت تطبيق تمعّن"
      className="fixed bottom-16 md:bottom-6 left-4 right-4 z-40 mx-auto max-w-md border-t border-[#c9b88a]/40 bg-[#f4f1ea] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-bold text-[#2f2619]">
            ثبّت تمعّن على شاشتك
          </p>
          {isIos ? (
            <p className="text-xs leading-relaxed text-[#5f5648]/85">
              اضغط على زر المشاركة <span className="inline-block mx-1">⎙</span>
              ثم &ldquo;إضافة إلى الشاشة الرئيسية&rdquo;
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-[#5f5648]/85">
              أيقونة على شاشتك — فتح أسرع، بلا متصفح.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="إخفاء"
          className="text-xs text-[#8c7851]/50 hover:text-[#8c7851]"
        >
          ✕
        </button>
      </div>
      {!isIos && deferred && (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 w-full border border-[#5a4a35] bg-[#5a4a35] text-[#fcfaf7] py-2 text-xs font-bold hover:opacity-90"
        >
          تثبيت
        </button>
      )}
    </div>
  );
}
