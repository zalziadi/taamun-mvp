"use client";

import { useState, useEffect } from "react";

const DISMISS_KEY = "taamun.growth.dismissed";
const DISMISS_DAYS = 3;

interface GrowthOffer {
  show_offer: boolean;
  type?: string;
  message?: string;
  cta?: string;
  url?: string;
  framing?: string;
}

interface GrowthPromptProps {
  /** If provided, use this instead of fetching from API */
  offer?: { message: string; cta: string; url: string };
  onDismiss?: () => void;
}

export function GrowthPrompt({ offer, onDismiss }: GrowthPromptProps) {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<GrowthOffer | null>(null);

  useEffect(() => {
    // Check dismiss flag
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const daysSince = (Date.now() - new Date(dismissed).getTime()) / 86400000;
      if (daysSince < DISMISS_DAYS) return;
    }

    if (offer) {
      setData({ show_offer: true, message: offer.message, cta: offer.cta, url: offer.url });
      setTimeout(() => setVisible(true), 600);
      return;
    }

    // Fetch from API
    fetch("/api/growth-trigger", { method: "POST" })
      .then(r => r.json())
      .then((d: GrowthOffer) => {
        if (d.show_offer) {
          setData(d);
          setTimeout(() => setVisible(true), 600);
        }
      })
      .catch(() => {});
  }, [offer]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setVisible(false);
    onDismiss?.();
  };

  if (!visible || !data) return null;

  return (
    <div
      className="mx-auto max-w-md animate-[fadeUp_0.6s_ease_both]"
      style={{ animationDelay: "0.2s" }}
    >
      <div
        className="relative rounded-2xl p-5 border"
        style={{
          background: "linear-gradient(135deg, rgba(201,169,110,0.12), rgba(201,169,110,0.04))",
          borderColor: "rgba(201,169,110,0.25)",
        }}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 left-3 text-sm opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: "#C9A96E" }}
          aria-label="إغلاق"
        >
          ✕
        </button>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto"
          style={{ background: "rgba(201,169,110,0.15)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>

        <p
          className="text-center text-sm mb-4 leading-relaxed"
          style={{ color: "rgba(232,225,217,0.85)", lineHeight: 1.8 }}
        >
          {data.message}
        </p>

        <a
          href={data.url ?? "/pricing"}
          className="block w-full text-center py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #C9A96E, #A68B4B)",
            color: "#15130f",
          }}
        >
          {data.cta ?? "أكمل الرحلة"}
        </a>
      </div>
    </div>
  );
}
