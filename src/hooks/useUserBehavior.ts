"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadBehavior,
  saveBehavior,
  recordPageVisit,
  recordDecisionClick,
  recordReflectionSaved,
  recordNextStepClicked,
  recordCtaSeen,
  recordCtaDismissed,
  recordActionSpeed,
  recordBackNavigation,
  type UserBehavior,
} from "@/lib/behavior/userBehavior";
import { getUserPattern, type UserPattern } from "@/lib/patterns/userPattern";

/**
 * useUserBehavior — React hook for tracking + reading user behavior.
 *
 * Pattern:
 *   const { behavior, pattern, track } = useUserBehavior("reflection");
 *   // ... later:
 *   track.reflectionSaved();
 *
 * The hook auto-records a page visit on mount.
 */
export function useUserBehavior(pageName?: string) {
  const [behavior, setBehavior] = useState<UserBehavior>(() => loadBehavior());
  const [pageOpenedAt] = useState(() => Date.now());

  // Auto-record page visit on mount (once per mount)
  useEffect(() => {
    if (!pageName) return;
    setBehavior((prev) => {
      const next = recordPageVisit(prev);
      saveBehavior(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageName]);

  // Compute pattern from current behavior (memoized)
  const pattern: UserPattern = useMemo(() => getUserPattern(behavior), [behavior]);

  // Helper to apply a mutation + persist
  const apply = useCallback((mutator: (b: UserBehavior) => UserBehavior) => {
    setBehavior((prev) => {
      const next = mutator(prev);
      saveBehavior(next);
      return next;
    });
  }, []);

  // Compute time-since-page-open in seconds
  const elapsedSeconds = useCallback(() => {
    return Math.round((Date.now() - pageOpenedAt) / 1000);
  }, [pageOpenedAt]);

  // Track API
  const track = useMemo(
    () => ({
      decisionClick: () => {
        apply((b) => recordActionSpeed(recordDecisionClick(b), elapsedSeconds()));
      },
      reflectionSaved: () => {
        apply((b) => recordActionSpeed(recordReflectionSaved(b), elapsedSeconds()));
      },
      nextStepClicked: () => {
        apply((b) => recordActionSpeed(recordNextStepClicked(b), elapsedSeconds()));
      },
      ctaSeen: () => {
        apply(recordCtaSeen);
      },
      ctaDismissed: () => {
        apply(recordCtaDismissed);
      },
      backNavigation: () => {
        apply(recordBackNavigation);
      },
    }),
    [apply, elapsedSeconds]
  );

  return { behavior, pattern, track };
}
