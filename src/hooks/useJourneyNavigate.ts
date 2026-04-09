"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  evaluateAndLog,
  logJourneyEvent,
  type NavigationEvaluation,
} from "@/lib/journey/navigation";
import {
  loadTimeline,
  saveTimeline,
  recordVisit,
  popToPrevious,
  previousRoute,
  canGoBack,
  type JourneyTimeline,
} from "@/lib/journey/stack";
import { useJourneyMemory } from "./useJourneyMemory";

interface NavigateOptions {
  /** If true, ignore block/soft_notice decisions and route anyway. */
  force?: boolean;
  /** Called with the evaluation so the caller can show a notice UI. */
  onBlocked?: (evaluation: NavigationEvaluation) => void;
}

interface UseJourneyNavigateResult {
  /** The canonical navigation gate. Every internal CTA should use this. */
  navigate: (route: string, options?: NavigateOptions) => NavigationEvaluation;
  /** Go back to the previous journey route (not browser back). */
  back: () => boolean;
  /** Live snapshot of the journey timeline stack. */
  timeline: JourneyTimeline;
  /** Is there a previous step to go back to? */
  canGoBack: boolean;
  /** The most recent navigation decision — for debug surfaces. */
  lastDecision: NavigationEvaluation | null;
}

/**
 * useJourneyNavigate — the opt-in navigation gate.
 *
 * Every button/CTA that wants departure-side enforcement should use this
 * instead of calling `router.push()` directly. It:
 *
 *   1. Evaluates the destination against journey state
 *   2. Logs the attempt (nav_attempt / nav_allowed / nav_blocked / nav_soft_notice)
 *   3. Records the visit in the timeline stack (if trackable)
 *   4. Calls router.push() only if allowed (or force === true)
 *   5. Calls onBlocked with the reconciliation so the caller can show UI
 *
 * Direct `router.push()` calls remain possible — Next.js doesn't let us
 * ban them. This hook is an opt-in convention, enforced by team
 * discipline + arrival-side classifyVisit() on every destination page.
 */
export function useJourneyNavigate(): UseJourneyNavigateResult {
  const router = useRouter();
  const { state } = useJourneyMemory();
  const [timeline, setTimeline] = useState<JourneyTimeline>(() => loadTimeline());
  const [lastDecision, setLastDecision] = useState<NavigationEvaluation | null>(null);

  // Record the current page on mount (if we know it)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname;
    setTimeline((prev) => {
      const next = recordVisit(prev, currentPath);
      if (next !== prev) saveTimeline(next);
      return next;
    });
  }, []);

  const navigate = useCallback(
    (route: string, options: NavigateOptions = {}): NavigationEvaluation => {
      const { force = false, onBlocked } = options;

      // Log the attempt before the decision so we can debug intent even
      // when the gate blocks it.
      logJourneyEvent({ kind: "nav_attempt", route });

      const from =
        typeof window !== "undefined" ? window.location.pathname : undefined;

      const evaluation = evaluateAndLog(route, state, from);
      setLastDecision(evaluation);

      // Blocked: don't route unless force
      if (evaluation.decision === "block" && !force) {
        onBlocked?.(evaluation);
        return evaluation;
      }

      // Soft notice: still route — the destination page shows the notice
      // via its own classifyVisit() call on mount
      if (evaluation.decision === "soft_notice") {
        onBlocked?.(evaluation);
      }

      // Record the visit in the stack
      setTimeline((prev) => {
        const next = recordVisit(prev, evaluation.effectiveRoute);
        if (next !== prev) saveTimeline(next);
        return next;
      });

      router.push(evaluation.effectiveRoute);
      return evaluation;
    },
    [router, state]
  );

  const back = useCallback((): boolean => {
    const result = popToPrevious(timeline);
    if (!result) return false;
    setTimeline(result.timeline);
    saveTimeline(result.timeline);
    logJourneyEvent({
      kind: "nav_allowed",
      route: result.route,
      rule: "non_journey_route",
      decision: "allow",
      meta: { via: "back" },
    });
    router.push(result.route);
    return true;
  }, [router, timeline]);

  const canGoBackMemo = useMemo(() => canGoBack(timeline), [timeline]);

  return {
    navigate,
    back,
    timeline,
    canGoBack: canGoBackMemo,
    lastDecision,
  };
}

// Re-export for consumers who want to peek at previous route directly
export { previousRoute };
