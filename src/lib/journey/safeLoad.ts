/**
 * Safe State Loader — V10 PR-4
 *
 * Wraps `loadLocalJourneyState` with failure-mode handling:
 *
 *   - Parse errors → log corruption event, return fresh default state
 *   - Schema mismatches → normalize (already handled by normalizeJourneyState)
 *   - Direct localStorage manipulation → detected via sanity checks
 *   - Quota errors on save → swallowed, localStorage can become read-only
 *
 * Every consumer of the journey state should use this instead of the
 * raw loader so that corruption is recovered from, not propagated.
 */

import {
  createDefaultState,
  loadLocalJourneyState,
  saveLocalJourneyState,
  clearLocalJourneyState,
  normalizeJourneyState,
  type UserJourneyState,
} from "./memory";
import { logJourneyEvent } from "./navigation";

export interface SafeLoadResult {
  state: UserJourneyState;
  /** Was the state reset because it was corrupted? */
  wasCorrupted: boolean;
  /** Was the state reset because of a sanity check failure? */
  wasReset: boolean;
  /** Machine-readable reason when wasCorrupted or wasReset is true. */
  reason: string | null;
}

// ---------------------------------------------------------------------------
// Sanity checks — catches direct localStorage tampering
// ---------------------------------------------------------------------------

function sanityCheck(state: UserJourneyState): { ok: true } | { ok: false; reason: string } {
  if (!Number.isFinite(state.currentDay)) return { ok: false, reason: "currentDay_nan" };
  if (state.currentDay < 1 || state.currentDay > 28) return { ok: false, reason: "currentDay_out_of_range" };
  if (!Array.isArray(state.completedSteps)) return { ok: false, reason: "completedSteps_not_array" };
  if (!Array.isArray(state.keyInsights)) return { ok: false, reason: "keyInsights_not_array" };
  if (state.sessionCount < 0) return { ok: false, reason: "negative_sessionCount" };
  if (state.momentum < -10 || state.momentum > 10) return { ok: false, reason: "momentum_out_of_range" };
  if (state.resistance < 0 || state.resistance > 1) return { ok: false, reason: "resistance_out_of_range" };
  if (state.drift < 0) return { ok: false, reason: "negative_drift" };

  // Cross-field sanity: if a day_N appears in completedSteps where N > currentDay + 1,
  // something has been tampered with.
  const maxCompletedDay = state.completedSteps
    .map((s) => {
      const m = /^day_(\d+)$/.exec(s);
      return m ? Number(m[1]) : 0;
    })
    .reduce((a, b) => Math.max(a, b), 0);
  if (maxCompletedDay > state.currentDay + 1) {
    return { ok: false, reason: "completedSteps_ahead_of_currentDay" };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Safe load — the only entry point consumers should use
// ---------------------------------------------------------------------------

/**
 * Load journey state with automatic corruption recovery.
 *
 * If the state is corrupted or fails sanity checks, the loader:
 *   1. Logs a `state_corrupted` event with the reason
 *   2. Clears localStorage
 *   3. Returns a fresh default state
 *   4. Writes the fresh state back so the next load is clean
 *
 * Non-destructive: only resets if we're sure the data is bad. Schema
 * drift alone (missing fields) is handled by normalization.
 */
export function safeLoadJourneyState(userId: string = "anonymous"): SafeLoadResult {
  // loadLocalJourneyState already try/catches and returns defaults on parse error,
  // so a ParseError path doesn't exist here — but we still sanity check.
  let state: UserJourneyState;
  let wasCorrupted = false;
  let reason: string | null = null;

  try {
    state = loadLocalJourneyState(userId);
  } catch (err) {
    // Shouldn't happen — loader is already defensive — but belt and suspenders
    wasCorrupted = true;
    reason = "loader_threw";
    state = createDefaultState(userId);
    clearLocalJourneyState();
    logJourneyEvent({
      kind: "state_corrupted",
      meta: { reason, err: String(err).slice(0, 100) },
    });
    saveLocalJourneyState(state);
    logJourneyEvent({ kind: "state_reset", meta: { reason } });
    return { state, wasCorrupted: true, wasReset: true, reason };
  }

  // Sanity check
  const check = sanityCheck(state);
  if (!check.ok) {
    wasCorrupted = true;
    reason = check.reason;
    logJourneyEvent({
      kind: "state_corrupted",
      meta: { reason },
    });

    // Try to salvage what we can — normalize first, then re-check
    const salvaged = normalizeJourneyState(state, userId);
    const recheck = sanityCheck(salvaged);

    if (recheck.ok) {
      // Salvage worked — keep the normalized version
      saveLocalJourneyState(salvaged);
      logJourneyEvent({
        kind: "state_merged",
        meta: { reason: `salvaged_from_${reason}` },
      });
      return {
        state: salvaged,
        wasCorrupted: true,
        wasReset: false,
        reason,
      };
    }

    // Salvage failed — full reset
    const fresh = createDefaultState(userId);
    clearLocalJourneyState();
    saveLocalJourneyState(fresh);
    logJourneyEvent({ kind: "state_reset", meta: { reason } });
    return {
      state: fresh,
      wasCorrupted: true,
      wasReset: true,
      reason,
    };
  }

  return { state, wasCorrupted: false, wasReset: false, reason: null };
}
