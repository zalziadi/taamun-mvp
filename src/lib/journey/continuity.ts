/**
 * Continuity — the layer where user state becomes the source of truth.
 *
 * Pure module. Takes a UserJourneyState and answers the four questions
 * every page should ask before rendering:
 *
 *   1. hasStarted(state)           → should this user be onboarded or resumed?
 *   2. resumeRoute(state)          → where does "continue" actually go?
 *   3. classifyVisit(day, state)   → does this URL agree with my state?
 *   4. resolveJourneyRoute(state)  → what shape of UI should the router hub show?
 *
 * Design principle (from the Continuity prompt):
 *   "The user state is the source of truth, not the URL."
 *
 * This file does not touch the DOM, router, or localStorage. It is
 * called by hooks, pages, and guards — all of which can trust that
 * the same state always produces the same answer.
 */

import type { UserJourneyState } from "./memory";
import { TOTAL_DAYS } from "./phases";

// ---------------------------------------------------------------------------
// 1. hasStarted — is there enough evidence that this user is on a journey?
// ---------------------------------------------------------------------------

/**
 * A user has "started" if ANY of these are true:
 *   - they completed at least one day
 *   - they wrote at least one insight
 *   - they left a lastAnswer (even an unsaved reflection)
 *   - they've opened the app at least twice (second session implies intent)
 *
 * The first session alone doesn't count — we want the onboarding voice
 * to speak to them once before they're classified as "started".
 */
export function hasStarted(state: UserJourneyState): boolean {
  const completedDays = state.completedSteps.some((s) => /^day_\d+$/.test(s));
  if (completedDays) return true;
  if (state.keyInsights.length > 0) return true;
  if (state.lastAnswer && state.lastAnswer.trim().length > 0) return true;
  if (state.sessionCount >= 2) return true;
  return false;
}

// ---------------------------------------------------------------------------
// 2. resumeRoute — the single source of truth for "continue"
// ---------------------------------------------------------------------------

/**
 * Returns the route that represents "where the user was".
 *
 *   - Not started yet         → /program/day/1
 *   - Completed the whole run → /progress  (reflect, don't replay)
 *   - In the middle           → /program/day/{currentDay}
 *   - Had a last page visited → that page wins only if it's mid-journey
 *
 * Every "Continue" button in the app should call this. Don't compute
 * your own route; the rules live here.
 */
export function resumeRoute(state: UserJourneyState): string {
  // Fresh user — go to day 1 regardless
  if (!hasStarted(state)) {
    return "/program/day/1";
  }

  // Finished the run — send them to the timeline to reflect
  if (state.currentDay >= TOTAL_DAYS && isDayCompleted(state, TOTAL_DAYS)) {
    return "/progress";
  }

  // If the last page they were on is an interior page (not home, not
  // auth, not static), respect it — the user was there for a reason.
  if (isResumableInteriorPage(state.lastPageVisited)) {
    return state.lastPageVisited as string;
  }

  // Default: the day they're on
  return `/program/day/${clampDay(state.currentDay)}`;
}

function isDayCompleted(state: UserJourneyState, day: number): boolean {
  return state.completedSteps.includes(`day_${day}`);
}

function isResumableInteriorPage(page: string | null): boolean {
  if (!page) return false;
  // Resume these — they represent actual journey presence
  if (page.startsWith("/program/day/")) return true;
  if (page === "/reflection") return true;
  if (page === "/city") return true;
  // Don't resume these — they're meta/landing pages
  return false;
}

function clampDay(d: number): number {
  if (!Number.isFinite(d)) return 1;
  return Math.max(1, Math.min(TOTAL_DAYS, Math.round(d)));
}

// ---------------------------------------------------------------------------
// 3. classifyVisit — reconciliation between a URL and the state
// ---------------------------------------------------------------------------

export type VisitClassification =
  | { kind: "match" }
  | { kind: "ahead_of_state"; visited: number; expected: number; gap: number }
  | { kind: "behind_state"; visited: number; expected: number; gap: number; wasCompleted: boolean }
  | { kind: "locked"; visited: number; expected: number }
  | { kind: "invalid"; visited: number };

/**
 * Compare a URL day with the user's state and return a structured
 * classification. The caller decides whether to redirect, show a
 * gentle notice, or render anyway.
 *
 * Contract:
 *   match           → visited === currentDay
 *   ahead_of_state  → visited > currentDay + 1  (more than one ahead)
 *   locked          → visited === currentDay + 1 and not yet unlocked
 *   behind_state    → visited < currentDay
 *   invalid         → out of [1, TOTAL_DAYS]
 */
export function classifyVisit(
  visited: number,
  state: UserJourneyState
): VisitClassification {
  if (!Number.isInteger(visited) || visited < 1 || visited > TOTAL_DAYS) {
    return { kind: "invalid", visited };
  }

  const expected = clampDay(state.currentDay);

  if (visited === expected) return { kind: "match" };

  if (visited < expected) {
    return {
      kind: "behind_state",
      visited,
      expected,
      gap: expected - visited,
      wasCompleted: isDayCompleted(state, visited),
    };
  }

  // visited > expected
  if (visited === expected + 1) {
    // Only "locked" if current day hasn't been completed yet
    if (!isDayCompleted(state, expected)) {
      return { kind: "locked", visited, expected };
    }
    // If current day is completed, visiting next is a match in spirit
    return { kind: "match" };
  }

  return {
    kind: "ahead_of_state",
    visited,
    expected,
    gap: visited - expected,
  };
}

// ---------------------------------------------------------------------------
// 4. boot — what to do when the app first loads
// ---------------------------------------------------------------------------

export interface BootDestination {
  route: string;
  /** Human reason in Arabic — used by loaders/banners if displayed. */
  reason: string;
  /** Whether this destination is a redirect (not the page the user asked for). */
  redirected: boolean;
}

/**
 * Compute where the user should *actually* land when they open the app.
 *
 * Called by `/program` (the entry hub) and optionally by other guards.
 * Does NOT get called on the homepage `/` — the homepage has its own
 * content (WhyYouAreHere + subscription gates) and is the one place
 * the user is allowed to just "be".
 */
export function bootDestination(state: UserJourneyState): BootDestination {
  if (!hasStarted(state)) {
    return {
      route: "/program/day/1",
      reason: "لم تبدأ الرحلة بعد — ندخلها معاً من اليوم الأوّل.",
      redirected: false,
    };
  }

  const route = resumeRoute(state);
  return {
    route,
    reason: `كنتَ هنا — لم تغادر فعلاً. نُكمل من يوم ${state.currentDay}.`,
    redirected: true,
  };
}

// ---------------------------------------------------------------------------
// 5. Reconciliation messages — voice v2 tuned
// ---------------------------------------------------------------------------

/**
 * Turn a VisitClassification into a one-line message + optional CTA.
 * Used by the ResumeNotice banner on /program/day/[id].
 *
 * Voice rules (same as bridge.ts):
 *   - No imperatives in the message
 *   - The mirror tells the truth directly
 *   - CTA is the only place an action verb is allowed
 */
export interface ReconciliationMessage {
  /** Whether to show the banner at all. */
  visible: boolean;
  /** The one-line message shown in the banner. */
  message: string;
  /** The secondary line — the "why" under the message. */
  sublabel: string;
  /** CTA label + route. Null means "stay, don't offer a jump". */
  cta: { label: string; route: string } | null;
  /** Whether the visit should be blocked entirely (e.g., locked future day). */
  blocking: boolean;
}

export function reconciliationFor(
  classification: VisitClassification
): ReconciliationMessage {
  switch (classification.kind) {
    case "match":
      return {
        visible: false,
        message: "",
        sublabel: "",
        cta: null,
        blocking: false,
      };

    case "invalid":
      return {
        visible: true,
        message: "هذا ليس يوماً من رحلتك.",
        sublabel: "الرحلة ٢٨ يوماً — لا أكثر، ولا أقلّ.",
        cta: { label: "ارجع إلى رحلتك", route: "/program" },
        blocking: true,
      };

    case "locked":
      return {
        visible: true,
        message: `يوم ${classification.visited} لم يُفتح بعد.`,
        sublabel: `يوم ${classification.expected} ينتظر أن يكتمل أوّلاً — ليس حجزاً، بل إيقاعاً.`,
        cta: {
          label: `عُد إلى يوم ${classification.expected}`,
          route: `/program/day/${classification.expected}`,
        },
        blocking: true,
      };

    case "ahead_of_state":
      return {
        visible: true,
        message: `أنتَ تفتح يوم ${classification.visited}، لكنّك لم تصل إليه بعد.`,
        sublabel: `الفجوة ${classification.gap} أيام — الرحلة لا تُختصر، هي تُعاش.`,
        cta: {
          label: `عُد إلى يوم ${classification.expected}`,
          route: `/program/day/${classification.expected}`,
        },
        blocking: true,
      };

    case "behind_state":
      if (classification.wasCompleted) {
        return {
          visible: true,
          message: `يوم ${classification.visited} — مكتملٌ من قبل.`,
          sublabel:
            "لا بأس بالعودة إليه. لكن ما ينتظرك لم يعد هنا — هو في يوم آخر.",
          cta: {
            label: `تابع من يوم ${classification.expected}`,
            route: `/program/day/${classification.expected}`,
          },
          blocking: false,
        };
      }
      return {
        visible: true,
        message: `يوم ${classification.visited} — تجاوزته دون أن تكتمله.`,
        sublabel: "العودة إلى يومٍ لم يُغلَق ليست تراجعاً. هي إنصاف له.",
        cta: null,
        blocking: false,
      };
  }
}

// ---------------------------------------------------------------------------
// 6. resolveJourneyRoute — router hub decision
// ---------------------------------------------------------------------------

/**
 * The three shapes a journey hub (`/program`) can take for a given
 * state. Used by the router hub to decide whether to show a welcome
 * experience, auto-redirect to the user's current day, or send them
 * to reflect on a completed run.
 *
 * Thin adapter over hasStarted + resumeRoute + day completion detection.
 * Adds no new logic — just classifies existing logic into the shape
 * pages want to switch on.
 */
export type JourneyRouteDecision =
  | { kind: "welcome"; reason: "no_evidence_yet" }
  | { kind: "day"; day: number; route: string }
  | { kind: "completed"; route: string };

/**
 * Given a user's journey state, decide what shape of UI the router
 * hub should show.
 *
 *   welcome   → user has no evidence of starting (fresh or 1st session)
 *   completed → all 28 days done and day 28 is in completedSteps
 *   day       → anything else — mid-journey, uses resumeRoute
 */
export function resolveJourneyRoute(state: UserJourneyState): JourneyRouteDecision {
  if (!hasStarted(state)) {
    return { kind: "welcome", reason: "no_evidence_yet" };
  }

  if (
    state.currentDay >= TOTAL_DAYS &&
    state.completedSteps.includes(`day_${TOTAL_DAYS}`)
  ) {
    return { kind: "completed", route: "/progress" };
  }

  // Mid-journey — honor resumeRoute so lastPageVisited is respected
  const route = resumeRoute(state);

  // resumeRoute may return /reflection or /city when the user was on
  // an interior page. For the { kind: "day", day } decision we still
  // need a concrete day number, so we derive it from the URL when
  // possible, otherwise fall back to state.currentDay.
  const dayFromRoute = /^\/program\/day\/(\d+)/.exec(route)?.[1];
  const day = dayFromRoute ? Number(dayFromRoute) : clampDay(state.currentDay);

  return { kind: "day", day, route };
}
