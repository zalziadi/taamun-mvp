"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerRegistrar — registers /sw.js on page load.
 * Silent: no UI, no errors surfaced.
 *
 * Enables:
 *   - Offline caching of static shell + recent pages (v1.3 PWA)
 *   - Push notifications (v1.1)
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Defer to idle — no impact on LCP
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent: SW is progressive enhancement
      });
    };

    if ("requestIdleCallback" in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void })
        .requestIdleCallback(register);
    } else {
      setTimeout(register, 2000);
    }
  }, []);

  return null;
}
