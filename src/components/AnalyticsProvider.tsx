"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

export function AnalyticsProvider() {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const run = () => {
      initAnalytics();
    };

    const hasRequestIdleCallback =
      typeof window !== "undefined" && typeof window.requestIdleCallback === "function";

    if (hasRequestIdleCallback) {
      idleId = window.requestIdleCallback(run, { timeout: 2000 });
    } else {
      timeoutId = globalThis.setTimeout(run, 1200);
    }

    return () => {
      if (idleId !== null && typeof window !== "undefined" && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, []);

  return null;
}
