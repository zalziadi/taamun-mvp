"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  resolveSystemState,
  makeContext,
  type SystemDecision,
  type SystemContext,
  type BrainZone,
} from "@/lib/system/brain";
import { useUserBehavior } from "@/hooks/useUserBehavior";

interface UseSystemBrainOptions {
  pageName?: string;
  searchQuery?: string;
  /** If false, the hook doesn't fetch progress/city data (for pages that already have it). */
  autoFetch?: boolean;
  /** Override context values (e.g. pass pre-fetched city data). */
  overrides?: Partial<SystemContext>;
}

interface UseSystemBrainResult {
  decision: SystemDecision;
  context: SystemContext;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Reactive React hook that assembles a SystemContext from:
 * - useUserBehavior (client-side pattern)
 * - /api/program/progress (current day, streak, drift, momentum)
 * - /api/program/day/[currentDay] (city data + emotionalState)
 * - runtime overrides (searchQuery, etc.)
 *
 * Returns a SystemDecision that any page can render immediately.
 * Safe on SSR (guards on window via useUserBehavior).
 */
export function useSystemBrain(options: UseSystemBrainOptions = {}): UseSystemBrainResult {
  const { pageName, searchQuery, autoFetch = true, overrides } = options;
  const { pattern } = useUserBehavior(pageName);

  const [progressData, setProgressData] = useState<Partial<SystemContext["progress"]>>({
    hasStarted: false,
    currentDay: 1,
    streak: 0,
    momentum: 0,
    drift: 0,
  });
  const [cityData, setCityData] = useState<SystemContext["city"]>(null);
  const [emotionalState, setEmotionalState] = useState<SystemContext["emotionalState"]>("neutral");
  const [loading, setLoading] = useState(autoFetch);

  const fetchAll = useCallback(async () => {
    if (!autoFetch) {
      setLoading(false);
      return;
    }
    // Skip for unauthenticated users to avoid 401 console errors
    const hasAuth = typeof window !== "undefined" &&
      Object.keys(localStorage).some(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (!hasAuth) {
      setLoading(false);
      return;
    }
    try {
      const progRes = await fetch("/api/program/progress", { cache: "no-store" });
      if (progRes.ok) {
        const prog = await progRes.json();
        const completedCount = Array.isArray(prog.completed_days) ? prog.completed_days.length : 0;
        setProgressData({
          hasStarted: completedCount > 0,
          currentDay: prog.current_day ?? 1,
          streak: prog.streak ?? 0,
          momentum: prog.momentum ?? 0,
          drift: prog.drift ?? 0,
          completedCount,
        });
        // Emotional state from journey_state
        const emotion = prog.journey_state?.emotionalState;
        if (emotion === "lost") setEmotionalState("lost");
        else if (emotion === "engaged") setEmotionalState("engaged");
        else setEmotionalState("neutral");

        // Fetch day-level city data
        const day = prog.current_day ?? 1;
        try {
          const dayRes = await fetch(`/api/program/day/${day}`, { cache: "no-store" });
          if (dayRes.ok) {
            const dayData = await dayRes.json();
            if (dayData.city) {
              const zones: BrainZone[] = (dayData.city.zones ?? []).map((z: {
                id: string;
                name: string;
                state: string;
                energy: number;
              }) => ({
                id: z.id,
                name: z.name,
                state: (z.state as BrainZone["state"]) ?? "weak",
                energy: z.energy ?? 0,
              }));
              setCityData({
                dominantZone: dayData.city.dominantZone ?? null,
                weakestZone: dayData.city.weakestZone ?? null,
                zones,
              });
            }
          }
        } catch {
          // City data is optional
        }
      }
    } catch {
      // Graceful fallback — keep defaults
    } finally {
      setLoading(false);
    }
  }, [autoFetch]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Build context reactively
  const context = useMemo<SystemContext>(() => {
    return makeContext({
      userPattern: pattern.type,
      progress: {
        hasStarted: progressData.hasStarted ?? false,
        currentDay: progressData.currentDay ?? 1,
        streak: progressData.streak ?? 0,
        momentum: progressData.momentum ?? 0,
        drift: progressData.drift ?? 0,
        completedCount: progressData.completedCount,
      },
      city: overrides?.city ?? cityData,
      searchQuery: searchQuery,
      emotionalState: overrides?.emotionalState ?? emotionalState,
      ...overrides,
    });
  }, [pattern.type, progressData, cityData, searchQuery, emotionalState, overrides]);

  // Compute decision reactively
  const decision = useMemo(() => resolveSystemState(context), [context]);

  return {
    decision,
    context,
    loading,
    refresh: fetchAll,
  };
}
