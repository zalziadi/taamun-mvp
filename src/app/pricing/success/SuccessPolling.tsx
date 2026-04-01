"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type SubStatus = {
  active: boolean;
  tier: string | null;
  expires_at: string | null;
};

const TIER_LABELS: Record<string, string> = {
  trial: "تجربة مجانية",
  quarterly: "ربع سنوي",
  yearly: "سنوي",
  vip: "VIP",
  // Legacy
  eid: "عيدية",
  monthly: "شهري",
};

/**
 * Polls /api/subscription/status every 5s until activation detected.
 * Falls back to success message after 60s timeout.
 */
export function SuccessPolling() {
  const [status, setStatus] = useState<"polling" | "active" | "timeout">(
    "polling"
  );
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [dots, setDots] = useState(0);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription/status", {
        credentials: "include",
      });
      if (!res.ok) return false;
      const data = (await res.json()) as SubStatus & { ok: boolean };
      if (data.ok && data.active) {
        setSub(data);
        setStatus("active");
        return true;
      }
    } catch {
      // ignore network errors, keep polling
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let pollCount = 0;
    const maxPolls = 12; // 12 * 5s = 60s

    const poll = async () => {
      if (cancelled) return;
      const activated = await checkStatus();
      if (activated || cancelled) return;

      pollCount++;
      if (pollCount >= maxPolls) {
        setStatus("timeout");
        return;
      }
      setTimeout(poll, 5000);
    };

    // Start polling immediately
    poll();

    return () => {
      cancelled = true;
    };
  }, [checkStatus]);

  // Animated dots
  useEffect(() => {
    if (status !== "polling") return;
    const interval = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, [status]);

  /* ── Activated ── */
  if (status === "active") {
    return (
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3">تم تفعيل اشتراكك</h1>
        <p className="text-zinc-400 leading-7 mb-2">
          مرحباً بك في رحلة تمعّن.
        </p>
        {sub?.tier && (
          <p className="text-[#6D8BFF] font-semibold mb-8">
            باقة {TIER_LABELS[sub.tier] ?? sub.tier}
          </p>
        )}
        <Link
          href="/program"
          className="inline-block bg-[#6D8BFF] hover:bg-[#5a78ee] text-white font-bold px-8 py-3 rounded-xl transition-colors cursor-pointer"
        >
          ابدأ رحلتك الآن
        </Link>
      </div>
    );
  }

  /* ── Timeout — payment received but activation pending ── */
  if (status === "timeout") {
    return (
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3">شكراً لك!</h1>
        <p className="text-zinc-400 leading-7 mb-4">
          تم استلام طلبك بنجاح.
          <br />
          جاري تفعيل اشتراكك — قد يستغرق دقائق قليلة.
        </p>
        <p className="text-zinc-500 text-sm mb-8">
          ستصلك رسالة تأكيد عند التفعيل. يمكنك التحقق من حالة اشتراكك في صفحة
          حسابك.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/account"
            className="inline-block bg-[#6D8BFF] hover:bg-[#5a78ee] text-white font-bold px-8 py-3 rounded-xl transition-colors cursor-pointer"
          >
            صفحة حسابي
          </Link>
          <Link
            href="/"
            className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-3 rounded-xl transition-colors cursor-pointer"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  /* ── Polling — waiting for activation ── */
  return (
    <div className="text-center max-w-md">
      <div className="w-16 h-16 rounded-full bg-[#6D8BFF]/10 text-[#6D8BFF] flex items-center justify-center mx-auto mb-6 animate-pulse">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-3">شكراً لك!</h1>
      <p className="text-zinc-400 leading-7 mb-6">
        جاري تفعيل اشتراكك{".".repeat(dots)}
      </p>
      <div className="w-48 h-1 bg-zinc-800 rounded-full mx-auto overflow-hidden">
        <div className="h-full bg-[#6D8BFF] rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
