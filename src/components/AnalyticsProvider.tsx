"use client";

import { Suspense, useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";
import { PageviewTracker } from "./PageviewTracker";

export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);

  // Suspense boundary is REQUIRED: useSearchParams() inside PageviewTracker
  // opts the whole subtree into CSR bailout otherwise (Next.js 14 / React 18).
  // See .planning/research/STACK.md §"PostHog Event Instrumentation".
  return (
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  );
}
