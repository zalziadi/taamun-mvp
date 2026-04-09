/**
 * Journey Timeline Stack — V10 PR-4
 *
 * A small persistent stack that tracks the user's journey navigation
 * independently from the browser's history stack. This lets us:
 *
 *   - Implement "back" that respects journey logic (not browser default)
 *   - Know the previous meaningful page without relying on document.referrer
 *   - Survive refresh (the browser stack doesn't)
 *   - Filter out non-journey routes (auth, pricing, etc.) from the trail
 *
 * Storage: localStorage under `taamun.journey.stack.v1`.
 *
 * Pure logic + isolated storage I/O. No React.
 */

const STACK_KEY = "taamun.journey.stack.v1";
const MAX_STACK = 20;

export interface JourneyTimeline {
  /** The route the user is on right now. */
  current: string | null;
  /** The ordered path the user walked through the journey (oldest → newest). */
  stack: string[];
  /** Flat history of every journey route visited (deduped consecutively). */
  history: string[];
}

// ---------------------------------------------------------------------------
// Which routes count as "journey routes" worth tracking
// ---------------------------------------------------------------------------

/**
 * Returns true if this route represents actual journey presence.
 * Auth, pricing, admin, static pages are excluded so that "back"
 * never sends the user to /login or /pricing.
 */
export function isTrackableRoute(route: string): boolean {
  if (!route || typeof route !== "string") return false;
  if (route.startsWith("/auth")) return false;
  if (route.startsWith("/login")) return false;
  if (route.startsWith("/admin")) return false;
  if (route.startsWith("/pricing")) return false;
  if (route.startsWith("/book")) return false;
  if (route.startsWith("/api/")) return false;
  if (route.startsWith("/privacy")) return false;
  if (route === "/scan") return false;

  // Journey-bearing routes
  if (route === "/") return true;
  if (route === "/program") return true;
  if (route.startsWith("/program/day/")) return true;
  if (route === "/reflection") return true;
  if (route === "/city") return true;
  if (route === "/progress") return true;
  if (route === "/journey") return true;

  // Unknown — default to false. Better to miss a tracking event than
  // pollute the back stack with /ramadan or /stitch.
  return false;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emptyTimeline(): JourneyTimeline {
  return { current: null, stack: [], history: [] };
}

export function loadTimeline(): JourneyTimeline {
  if (!isBrowser()) return emptyTimeline();
  try {
    const raw = window.localStorage.getItem(STACK_KEY);
    if (!raw) return emptyTimeline();
    const parsed = JSON.parse(raw);
    return normalize(parsed);
  } catch {
    return emptyTimeline();
  }
}

export function saveTimeline(timeline: JourneyTimeline): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STACK_KEY, JSON.stringify(timeline));
  } catch {
    // Quota / private mode — swallow
  }
}

export function clearTimeline(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STACK_KEY);
  } catch {}
}

function normalize(input: unknown): JourneyTimeline {
  if (!input || typeof input !== "object") return emptyTimeline();
  const obj = input as Record<string, unknown>;
  const current = typeof obj.current === "string" ? obj.current : null;
  const stack = Array.isArray(obj.stack)
    ? obj.stack.filter((x): x is string => typeof x === "string").slice(-MAX_STACK)
    : [];
  const history = Array.isArray(obj.history)
    ? obj.history.filter((x): x is string => typeof x === "string").slice(-MAX_STACK * 2)
    : [];
  return { current, stack, history };
}

// ---------------------------------------------------------------------------
// Pure operations
// ---------------------------------------------------------------------------

/**
 * Record a visit. If the route isn't trackable, the timeline is unchanged.
 *
 * Rules:
 *   - If the new route matches `current`, nothing changes (refresh).
 *   - The current route (if any) gets pushed onto the stack.
 *   - Consecutive duplicates in history are collapsed.
 */
export function recordVisit(
  timeline: JourneyTimeline,
  route: string
): JourneyTimeline {
  if (!isTrackableRoute(route)) return timeline;
  if (timeline.current === route) return timeline;

  const nextStack = timeline.current
    ? [...timeline.stack, timeline.current].slice(-MAX_STACK)
    : timeline.stack;

  const lastHistory = timeline.history[timeline.history.length - 1];
  const nextHistory =
    lastHistory === route
      ? timeline.history
      : [...timeline.history, route].slice(-MAX_STACK * 2);

  return {
    current: route,
    stack: nextStack,
    history: nextHistory,
  };
}

/**
 * Pop the last route off the stack. Returns the route to navigate to,
 * along with the updated timeline. Returns null if nothing to pop.
 */
export function popToPrevious(
  timeline: JourneyTimeline
): { route: string; timeline: JourneyTimeline } | null {
  if (timeline.stack.length === 0) return null;
  const nextStack = timeline.stack.slice(0, -1);
  const route = timeline.stack[timeline.stack.length - 1];
  return {
    route,
    timeline: {
      current: route,
      stack: nextStack,
      history: timeline.history,
    },
  };
}

/** The most recent previous trackable route, or null. */
export function previousRoute(timeline: JourneyTimeline): string | null {
  if (timeline.stack.length === 0) return null;
  return timeline.stack[timeline.stack.length - 1];
}

/** Does this timeline have a meaningful previous step to go back to? */
export function canGoBack(timeline: JourneyTimeline): boolean {
  return timeline.stack.length > 0;
}
