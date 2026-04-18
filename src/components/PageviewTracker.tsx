"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { isExcludedPath } from "@/lib/analytics/excludedPaths";

/**
 * App Router pageview tracker (ANALYTICS-01 + ANALYTICS-02).
 *
 * MUST be rendered inside a <Suspense fallback={null}> boundary — `useSearchParams()`
 * opts the whole subtree into CSR bailout otherwise (React 18 constraint per
 * .planning/research/STACK.md §"PostHog Event Instrumentation").
 *
 * Fires `$pageview` on pathname/search change — EXCEPT when `isExcludedPath()`
 * matches (PROJECT.md principle #4: no tracking on prayer/reflection pages).
 *
 * When PostHog is not initialized (e.g., env vars missing) this is a silent
 * no-op: `posthog.__loaded` stays false, so we never capture.
 *
 * Pageview is intentionally NOT routed through `track()` in src/lib/analytics.ts
 * because `track()` auto-attaches UTM data — UTM is already attached to the
 * session at init (identify), so re-attaching per pageview would bloat events.
 */
export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    if (isExcludedPath(pathname)) return;
    if (!posthog.__loaded) return;

    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
