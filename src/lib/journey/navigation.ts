/**
 * Navigation Gate — V10 PR-4
 *
 * The single evaluator every page (and every CTA that chooses to opt in)
 * consults before routing. It answers:
 *
 *   - Can this user go to this route right now?
 *   - If not, what should we show them instead?
 *   - What event should we log so we can debug this later?
 *
 * Honest limits (read this before assuming enforcement):
 *
 *   Next.js App Router does NOT allow library code to intercept
 *   `router.push()`, `<Link>` clicks, or browser URL changes globally.
 *   That's not a bug we can fix — it's the framework contract.
 *
 *   So this module implements enforcement on ARRIVAL, not departure:
 *
 *     - Every destination page that matters should call
 *       `evaluateNavigation()` on mount.
 *     - Any caller that can opt in (internal buttons, hooks) should
 *       also call it before navigating — to get the bridge/notice
 *       one frame earlier.
 *
 *   The `useJourneyNavigate()` hook and `<JourneyLink>` component
 *   give consumers an opt-in gate for departure-side enforcement.
 *   Everything else is enforced on arrival.
 *
 * Pure module — no React, no router.
 */

import type { UserJourneyState } from "./memory";
import { classifyVisit, reconciliationFor, type VisitClassification } from "./continuity";

// ---------------------------------------------------------------------------
// Decision type
// ---------------------------------------------------------------------------

export type NavigationDecision =
  | "allow"        // go ahead, no notice needed
  | "soft_notice"  // go ahead, but show a reconciliation banner
  | "block";       // don't render the destination content; show notice only

export interface NavigationEvaluation {
  decision: NavigationDecision;
  /** The visit classification (null if route doesn't need day validation). */
  classification: VisitClassification | null;
  /** Human-facing reconciliation — present for soft_notice and block. */
  reconciliation: ReturnType<typeof reconciliationFor> | null;
  /** The actual route the user should end up on. */
  effectiveRoute: string;
  /** Machine label for logging/debug. */
  rule:
    | "fresh_user"
    | "day_match"
    | "day_behind_completed"
    | "day_behind_uncompleted"
    | "day_ahead"
    | "day_locked"
    | "day_invalid"
    | "non_journey_route"
    | "allow_default";
}

// ---------------------------------------------------------------------------
// Route parsing
// ---------------------------------------------------------------------------

/**
 * Extract a day number from a `/program/day/N` URL.
 * Returns null for any other route.
 */
export function extractDayFromRoute(route: string): number | null {
  const match = /^\/program\/day\/(\d+)(?:[/?#].*)?$/.exec(route);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isInteger(n)) return null;
  return n;
}

/** Does this route belong to the day journey (and thus need validation)? */
export function isJourneyRoute(route: string): boolean {
  return extractDayFromRoute(route) !== null;
}

// ---------------------------------------------------------------------------
// Core evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluate whether the user can go to `route` given their current state.
 *
 * Safe to call:
 *   - On mount of a destination page (arrival enforcement)
 *   - From a hook or button handler before routing (departure enforcement)
 *   - In tests (pure function, same input → same output)
 */
export function evaluateNavigation(
  route: string,
  state: UserJourneyState
): NavigationEvaluation {
  const day = extractDayFromRoute(route);

  // Non-journey routes (home, reflection, city, progress, etc.) —
  // always allowed; other guards (auth) handle them.
  if (day === null) {
    return {
      decision: "allow",
      classification: null,
      reconciliation: null,
      effectiveRoute: route,
      rule: "non_journey_route",
    };
  }

  const classification = classifyVisit(day, state);
  const reconciliation = reconciliationFor(classification);

  switch (classification.kind) {
    case "match":
      return {
        decision: "allow",
        classification,
        reconciliation: null,
        effectiveRoute: route,
        rule: "day_match",
      };

    case "invalid":
      return {
        decision: "block",
        classification,
        reconciliation,
        effectiveRoute: "/program",
        rule: "day_invalid",
      };

    case "locked":
      return {
        decision: "block",
        classification,
        reconciliation,
        effectiveRoute: `/program/day/${classification.expected}`,
        rule: "day_locked",
      };

    case "ahead_of_state":
      return {
        decision: "block",
        classification,
        reconciliation,
        effectiveRoute: `/program/day/${classification.expected}`,
        rule: "day_ahead",
      };

    case "behind_state":
      return {
        decision: "soft_notice",
        classification,
        reconciliation,
        effectiveRoute: route,
        rule: classification.wasCompleted
          ? "day_behind_completed"
          : "day_behind_uncompleted",
      };
  }
}

// ---------------------------------------------------------------------------
// Observability — tiny localStorage ring buffer
// ---------------------------------------------------------------------------

const EVENT_LOG_KEY = "taamun.journey.events.v1";
const MAX_EVENTS = 50;

export type JourneyEventKind =
  | "boot"
  | "nav_attempt"
  | "nav_allowed"
  | "nav_blocked"
  | "nav_soft_notice"
  | "state_corrupted"
  | "state_reset"
  | "state_merged"
  | "resume_used"
  | "day_completed"
  | "reflection_saved";

export interface JourneyEvent {
  kind: JourneyEventKind;
  at: string; // ISO timestamp
  route?: string;
  from?: string;
  rule?: NavigationEvaluation["rule"];
  decision?: NavigationDecision;
  meta?: Record<string, string | number | boolean | null>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Append a journey event to the ring buffer. Silent on failure. */
export function logJourneyEvent(event: Omit<JourneyEvent, "at">): void {
  if (!isBrowser()) return;
  try {
    const raw = window.localStorage.getItem(EVENT_LOG_KEY);
    const existing: JourneyEvent[] = raw ? JSON.parse(raw) : [];
    const next: JourneyEvent = { ...event, at: new Date().toISOString() };
    const trimmed = [...existing, next].slice(-MAX_EVENTS);
    window.localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota / private mode / anything else — swallow silently
  }
}

/** Read the recent event log — useful for debug surfaces. */
export function readJourneyEvents(): JourneyEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(EVENT_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JourneyEvent[]) : [];
  } catch {
    return [];
  }
}

/** Clear the event log (e.g., when the user resets their journey). */
export function clearJourneyEvents(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(EVENT_LOG_KEY);
  } catch {}
}

// ---------------------------------------------------------------------------
// Convenience: evaluate + log in one call
// ---------------------------------------------------------------------------

export interface RecordedEvaluation extends NavigationEvaluation {
  logged: boolean;
}

/**
 * Like `evaluateNavigation` but also writes a log entry describing the
 * outcome. Use this in hooks/buttons where you want both the decision
 * and the observability trail.
 */
export function evaluateAndLog(
  route: string,
  state: UserJourneyState,
  from?: string
): RecordedEvaluation {
  const result = evaluateNavigation(route, state);

  const kind: JourneyEventKind =
    result.decision === "allow"
      ? "nav_allowed"
      : result.decision === "block"
        ? "nav_blocked"
        : "nav_soft_notice";

  logJourneyEvent({
    kind,
    route,
    from,
    rule: result.rule,
    decision: result.decision,
  });

  return { ...result, logged: true };
}
