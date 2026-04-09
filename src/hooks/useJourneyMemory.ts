"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadLocalJourneyState,
  saveLocalJourneyState,
  updateJourneyState,
  buildContinuityMessage,
  classifySession,
  mergeStates,
  type UserJourneyState,
  type JourneyStatePatch,
  type ContinuityMessage,
  type SessionKind,
} from "@/lib/journey/memory";
import type { Timeline } from "@/lib/journey/timeline";
import type { NarrativeSnapshot } from "@/lib/journey/narrative";
import {
  generateWhyYouAreHere,
  type WhyYouAreHere,
} from "@/lib/narrative/bridge";
import {
  explainDecision,
  type DecisionExplanation,
  type ExplainableAction,
} from "@/lib/narrative/decisionExplainer";

interface UseJourneyMemoryOptions {
  /** Page name to auto-record as lastPageVisited on mount */
  pageName?: string;
  /** If false, skips fetching server state (for pages that don't need it) */
  syncWithServer?: boolean;
  /** Called after state loads (use for one-time side effects) */
  onLoad?: (state: UserJourneyState) => void;
  /**
   * V10 PR-2: if true, also fetch /api/journey/timeline so the hook can
   * expose `timeline`, `narrative`, and a richer `whyYouAreHere` bridge.
   */
  loadTimeline?: boolean;
  /**
   * V10 PR-2: context hint for the bridge — which page is asking.
   * Changes the "summary" voice (home vs day vs city).
   */
  bridgeContext?: "home" | "day" | "city" | "generic";
  /** V10 PR-2: if context === "day", the day being opened. */
  openingDay?: number;
}

interface UseJourneyMemoryResult {
  state: UserJourneyState;
  continuity: ContinuityMessage;
  session: SessionKind;
  loading: boolean;
  update: (patch: JourneyStatePatch) => void;
  refresh: () => Promise<void>;
  // V10 PR-2 additions
  timeline: Timeline | null;
  narrative: NarrativeSnapshot | null;
  whyYouAreHere: WhyYouAreHere;
  explain: (action: ExplainableAction, contextReason?: string) => DecisionExplanation;
}

/**
 * useJourneyMemory — React hook for loading + updating journey state.
 *
 * V10 PR-2: now also optionally loads /api/journey/timeline and exposes
 * a live `whyYouAreHere` bridge plus an `explain()` helper for CTAs.
 *
 * Behavior:
 *   1. On mount: load state from localStorage immediately (instant UI)
 *   2. Background: fetch server state + (optionally) timeline
 *   3. Every update: persist to localStorage + debounced server push
 *   4. Auto-record page visit if pageName provided
 *
 * The state is ALWAYS available — never null, never loading after first render.
 * The bridge is ALWAYS available — even before timeline loads (fallback mode).
 */
export function useJourneyMemory(options: UseJourneyMemoryOptions = {}): UseJourneyMemoryResult {
  const {
    pageName,
    syncWithServer = true,
    onLoad,
    loadTimeline = false,
    bridgeContext = "generic",
    openingDay,
  } = options;

  // Initial state from localStorage (instant)
  const [state, setState] = useState<UserJourneyState>(() => loadLocalJourneyState("anonymous"));
  const [loading, setLoading] = useState(syncWithServer);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [narrative, setNarrative] = useState<NarrativeSnapshot | null>(null);
  const serverSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  // Background server sync for journey_state
  const refresh = useCallback(async () => {
    if (!syncWithServer) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/journey/state", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && data.state) {
          setState((prev) => {
            const merged = mergeStates(data.state, prev);
            saveLocalJourneyState(merged);
            return merged;
          });
        }
      }
    } catch {
      // Graceful — keep localStorage state
    } finally {
      setLoading(false);
    }
  }, [syncWithServer]);

  // Background timeline + narrative load (V10 PR-2)
  const refreshTimeline = useCallback(async () => {
    if (!loadTimeline) return;
    try {
      const res = await fetch("/api/journey/timeline", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok && data.timeline && data.narrative) {
        setTimeline(data.timeline as Timeline);
        setNarrative(data.narrative as NarrativeSnapshot);
      }
    } catch {
      // Graceful — bridge still works from state alone
    }
  }, [loadTimeline]);

  // Initial load — auto-record session + page visit
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const initial = loadLocalJourneyState("anonymous");

    const incrementPatch: JourneyStatePatch = {
      incrementSession: true,
    };
    if (pageName) {
      incrementPatch.lastPageVisited = pageName;
    }
    const updated = updateJourneyState(initial, incrementPatch);
    setState(updated);
    saveLocalJourneyState(updated);

    onLoad?.(updated);

    void refresh();
    void refreshTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced server persist
  const scheduleServerPush = useCallback(
    (nextState: UserJourneyState) => {
      if (!syncWithServer) return;
      if (serverSyncTimer.current) clearTimeout(serverSyncTimer.current);
      serverSyncTimer.current = setTimeout(() => {
        void fetch("/api/journey/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: nextState }),
        }).catch(() => {
          // Silent fail — localStorage is source of truth
        });
      }, 1500);
    },
    [syncWithServer]
  );

  // Public update function
  const update = useCallback(
    (patch: JourneyStatePatch) => {
      setState((prev) => {
        const next = updateJourneyState(prev, patch);
        saveLocalJourneyState(next);
        scheduleServerPush(next);
        return next;
      });
    },
    [scheduleServerPush]
  );

  // Derived values
  const continuity = useMemo(() => buildContinuityMessage(state), [state]);
  const session = useMemo(() => classifySession(state), [state]);

  // V10 PR-2: live bridge — recomputes on every state/timeline change
  const whyYouAreHere = useMemo(
    () =>
      generateWhyYouAreHere({
        state,
        timeline,
        context: bridgeContext,
        openingDay,
      }),
    [state, timeline, bridgeContext, openingDay]
  );

  // V10 PR-2: explain() helper — lets callers attach "why" to any CTA
  const explain = useCallback(
    (action: ExplainableAction, contextReason?: string) =>
      explainDecision({ action, state, contextReason }),
    [state]
  );

  return {
    state,
    continuity,
    session,
    loading,
    update,
    refresh,
    timeline,
    narrative,
    whyYouAreHere,
    explain,
  };
}

// Re-export types for convenience
export type {
  UserJourneyState,
  JourneyStatePatch,
  ContinuityMessage,
  SessionKind,
  WhyYouAreHere,
  DecisionExplanation,
  ExplainableAction,
};
