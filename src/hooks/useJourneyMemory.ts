"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadLocalJourneyState,
  saveLocalJourneyState,
  updateJourneyState,
  buildContinuityMessage,
  classifySession,
  mergeStates,
  normalizeJourneyState,
  type UserJourneyState,
  type JourneyStatePatch,
  type ContinuityMessage,
  type SessionKind,
} from "@/lib/journey/memory";

interface UseJourneyMemoryOptions {
  /** Page name to auto-record as lastPageVisited on mount */
  pageName?: string;
  /** If false, skips fetching server state (for pages that don't need it) */
  syncWithServer?: boolean;
  /** Called after state loads (use for one-time side effects) */
  onLoad?: (state: UserJourneyState) => void;
}

interface UseJourneyMemoryResult {
  state: UserJourneyState;
  continuity: ContinuityMessage;
  session: SessionKind;
  loading: boolean;
  update: (patch: JourneyStatePatch) => void;
  refresh: () => Promise<void>;
}

/**
 * useJourneyMemory — React hook for loading + updating journey state.
 *
 * Behavior:
 *   1. On mount: load from localStorage immediately (instant UI)
 *   2. In background: fetch from server and merge (cross-device sync)
 *   3. Every update: persist to localStorage + schedule server push (debounced)
 *   4. Auto-record page visit if pageName provided
 *
 * The state is ALWAYS available — never null, never loading after first render.
 */
export function useJourneyMemory(options: UseJourneyMemoryOptions = {}): UseJourneyMemoryResult {
  const { pageName, syncWithServer = true, onLoad } = options;

  // Initial state from localStorage (instant)
  const [state, setState] = useState<UserJourneyState>(() => loadLocalJourneyState("anonymous"));
  const [loading, setLoading] = useState(syncWithServer);
  const serverSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  // Background server sync
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

  // Initial load — auto-record session + page visit
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const initial = loadLocalJourneyState("anonymous");

    // Record the session increment + page visit (once per mount)
    const incrementPatch: JourneyStatePatch = {
      incrementSession: true,
    };
    if (pageName) {
      incrementPatch.lastPageVisited = pageName;
    }
    const updated = updateJourneyState(initial, incrementPatch);
    setState(updated);
    saveLocalJourneyState(updated);

    // Fire onLoad callback
    onLoad?.(updated);

    // Background server sync
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced server persist
  const scheduleServerPush = useCallback((nextState: UserJourneyState) => {
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
  }, [syncWithServer]);

  // Public update function
  const update = useCallback((patch: JourneyStatePatch) => {
    setState((prev) => {
      const next = updateJourneyState(prev, patch);
      saveLocalJourneyState(next);
      scheduleServerPush(next);
      return next;
    });
  }, [scheduleServerPush]);

  // Derived values
  const continuity = buildContinuityMessage(state);
  const session = classifySession(state);

  return { state, continuity, session, loading, update, refresh };
}

// Re-export types for convenience
export type { UserJourneyState, JourneyStatePatch, ContinuityMessage, SessionKind };
