"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isExcludedPath } from "@/lib/analytics/excludedPaths";
import {
  DISMISS_KEY,
  DISMISS_COUNT_KEY,
  SESSION_EMIT_KEY,
  DISMISS_WINDOW_MS,
  type RenewalGateway,
  gatewayCtaHref,
  isDismissedFrom,
} from "./renewalBannerHelpers";

/**
 * RenewalBanner — Phase 9 user-facing renewal nudge.
 *
 * Mounts inside AppChrome's main content (above page children). Renders ONLY
 * when `/api/renewal/status` says `show=true`, the user hasn't dismissed
 * within 48h, and they haven't hit the 3-dismissal cap for this 7-day window.
 *
 * Structural invariants (enforced here, not by parents):
 *   - Sacred-path guard runs BEFORE any fetch: `/day/**`, `/reflection/**`,
 *     `/book/**`, `/program/day/**`, `/guide/**`, `/api/guide/**`. Single
 *     source of truth: `isExcludedPath()` from analytics/excludedPaths.
 *   - Zero server-rendered markup — initial SSR output is always `null`,
 *     the fetch only fires in useEffect. Keeps hydration safe.
 *   - No modal / no interstitial / no timers / no scarcity copy.
 *   - `renewal_prompted` analytics fires exactly once per SESSION, deduped
 *     via sessionStorage. Skipped for `gateway==='eid_code'` because that
 *     value is not part of the TypedEvent gateway union (09.04 plan note).
 *
 * Storage keys live in `./renewalBannerHelpers` — single source of truth.
 *
 * REQ coverage: RENEW-01, RENEW-02, RENEW-04, RENEW-05, ANALYTICS-06.
 */

type Status =
  | { show: false; reason?: string }
  | {
      show: true;
      gateway: RenewalGateway;
      daysRemaining: number;
      tier: string;
    };

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return isDismissedFrom(window.localStorage);
  } catch {
    return false;
  }
}

export function RenewalBanner() {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>({ show: false });
  const [hidden, setHidden] = useState(false);

  // Sacred-path structural guard — runs BEFORE any fetch.
  const onSacredPath = pathname ? isExcludedPath(pathname) : true;

  // Fetch status once per non-sacred route. No polling. No timers.
  useEffect(() => {
    if (onSacredPath) return;
    if (isDismissed()) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/renewal/status", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Status;
        if (!cancelled) setStatus(data);
      } catch {
        // Network error → silently no-op. Never crash the page.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onSacredPath, pathname]);

  // Fire renewal_prompted exactly once per session when the banner first
  // becomes visible. Deduped via sessionStorage so a remount (route change)
  // doesn't re-fire within the same session.
  useEffect(() => {
    if (!status.show || hidden || onSacredPath) return;
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(SESSION_EMIT_KEY) === "1") return;
      if (status.gateway === "eid_code") {
        // TypedEvent gateway union is ('salla'|'tap'|'stripe') — eid_code
        // users are routed to /pricing?source=expired and tracked in that
        // funnel, not renewal_prompted. Mark session as emitted to preserve
        // "fires at most once" invariant even on this skip path.
        window.sessionStorage.setItem(SESSION_EMIT_KEY, "1");
        return;
      }
      const gatewayForEvent: "salla" | "tap" | "stripe" = status.gateway;
      const daysRemaining = status.daysRemaining;
      const tier = status.tier;
      import("@/lib/analytics")
        .then(({ track }) => {
          track("renewal_prompted", {
            renewal_days_remaining: daysRemaining,
            gateway: gatewayForEvent,
            tier,
          });
        })
        .catch(() => {
          /* analytics import failed — never block the banner render */
        });
      window.sessionStorage.setItem(SESSION_EMIT_KEY, "1");
    } catch {
      /* sessionStorage blocked → accept that this session may double-emit;
         strictly better than crashing the banner */
    }
  }, [status, hidden, onSacredPath]);

  const handleDismiss = useCallback(() => {
    try {
      const until = Date.now() + DISMISS_WINDOW_MS;
      window.localStorage.setItem(DISMISS_KEY, String(until));
      const prev = Number(window.localStorage.getItem(DISMISS_COUNT_KEY) || 0);
      window.localStorage.setItem(DISMISS_COUNT_KEY, String(prev + 1));
    } catch {
      /* storage blocked — still hide in-memory for this session */
    }
    setHidden(true);
  }, []);

  if (onSacredPath) return null;
  if (!status.show) return null;
  if (hidden) return null;

  const href = gatewayCtaHref(status.gateway);

  // Copy: contemplative "واصل" framing. Hairline top/bottom on the Ta'ammun
  // raised bg. Text is static — no dynamic day numbers inside the copy.
  return (
    <div
      role="status"
      dir="rtl"
      className="border-y border-[#2A2621] bg-[#14120F] px-4 py-3 text-sm text-[#D6D1C8] transition-opacity duration-300"
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3">
        <p className="flex-1">واصل معنا — اشتراكك يقترب من الانتهاء.</p>
        <a
          href={href}
          className="rounded-md border border-[#C9A84C] px-3 py-1 text-[#C9A84C] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/45"
        >
          واصل رحلتك
        </a>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="إخفاء التذكير"
          className="rounded-md px-2 py-1 text-[#807A72] outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/45"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
