/**
 * User Behavior Tracker
 *
 * Client-side, localStorage-backed behavior log.
 * Captures granular interaction signals that complement the
 * server-side adaptive model (lib/adaptive/model.ts).
 *
 * - Pure module: no React imports
 * - Safe in SSR (guards on `window`)
 * - All operations are O(1) or bounded
 */

const STORAGE_KEY = "taamun.user.behavior.v1";
const MAX_INTERACTIONS = 30;
const MAX_SPEED_SAMPLES = 20;

// ── Types ──

export type InteractionTag =
  | "decision_click"
  | "decision_skipped"
  | "next_step_clicked"
  | "reflection_saved"
  | "reflection_started"
  | "back_navigation"
  | "page_visit"
  | "cta_seen"
  | "cta_dismissed";

export interface UserBehavior {
  decisionClicks: number;
  reflectionEngagement: number;
  actionSpeedAvg: number;          // seconds
  backNavigationCount: number;
  lastInteractions: string[];      // tags, latest first
  // V7 internal — for averaging
  speedSamples: number[];
  totalCtaSeen: number;
  totalCtaDismissed: number;
  lastUpdated: string;
}

const DEFAULT_BEHAVIOR: UserBehavior = {
  decisionClicks: 0,
  reflectionEngagement: 0,
  actionSpeedAvg: 0,
  backNavigationCount: 0,
  lastInteractions: [],
  speedSamples: [],
  totalCtaSeen: 0,
  totalCtaDismissed: 0,
  lastUpdated: new Date().toISOString(),
};

// ── Storage helpers ──

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadBehavior(): UserBehavior {
  if (!isBrowser()) return { ...DEFAULT_BEHAVIOR };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BEHAVIOR };
    const parsed = JSON.parse(raw) as Partial<UserBehavior>;
    return { ...DEFAULT_BEHAVIOR, ...parsed };
  } catch {
    return { ...DEFAULT_BEHAVIOR };
  }
}

export function saveBehavior(behavior: UserBehavior): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(behavior));
  } catch {
    // Quota exceeded or storage disabled — silent fail
  }
}

export function resetBehavior(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ── Mutators (pure: take behavior, return new behavior) ──

function pushInteraction(behavior: UserBehavior, tag: InteractionTag): UserBehavior {
  const next = [tag as string, ...behavior.lastInteractions].slice(0, MAX_INTERACTIONS);
  return { ...behavior, lastInteractions: next, lastUpdated: new Date().toISOString() };
}

export function recordDecisionClick(behavior: UserBehavior): UserBehavior {
  const next = pushInteraction(behavior, "decision_click");
  return { ...next, decisionClicks: behavior.decisionClicks + 1 };
}

export function recordDecisionSkipped(behavior: UserBehavior): UserBehavior {
  return pushInteraction(behavior, "decision_skipped");
}

export function recordReflectionSaved(behavior: UserBehavior): UserBehavior {
  const next = pushInteraction(behavior, "reflection_saved");
  return { ...next, reflectionEngagement: behavior.reflectionEngagement + 1 };
}

export function recordReflectionStarted(behavior: UserBehavior): UserBehavior {
  return pushInteraction(behavior, "reflection_started");
}

export function recordNextStepClicked(behavior: UserBehavior): UserBehavior {
  return pushInteraction(behavior, "next_step_clicked");
}

export function recordBackNavigation(behavior: UserBehavior): UserBehavior {
  const next = pushInteraction(behavior, "back_navigation");
  return { ...next, backNavigationCount: behavior.backNavigationCount + 1 };
}

export function recordPageVisit(behavior: UserBehavior): UserBehavior {
  return pushInteraction(behavior, "page_visit");
}

export function recordCtaSeen(behavior: UserBehavior): UserBehavior {
  const next = pushInteraction(behavior, "cta_seen");
  return { ...next, totalCtaSeen: behavior.totalCtaSeen + 1 };
}

export function recordCtaDismissed(behavior: UserBehavior): UserBehavior {
  const next = pushInteraction(behavior, "cta_dismissed");
  return { ...next, totalCtaDismissed: behavior.totalCtaDismissed + 1 };
}

/**
 * Record action speed (time from page open to action) in seconds.
 * Maintains rolling average over the last MAX_SPEED_SAMPLES samples.
 */
export function recordActionSpeed(behavior: UserBehavior, seconds: number): UserBehavior {
  const safeSeconds = Math.max(0, Math.min(3600, seconds)); // clamp 0-1h
  const samples = [safeSeconds, ...behavior.speedSamples].slice(0, MAX_SPEED_SAMPLES);
  const avg = samples.reduce((sum, s) => sum + s, 0) / samples.length;
  return {
    ...behavior,
    speedSamples: samples,
    actionSpeedAvg: Math.round(avg * 100) / 100,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Derived signals ──

export function getRecentInteractionCount(behavior: UserBehavior, tag: InteractionTag): number {
  return behavior.lastInteractions.filter((t) => t === tag).length;
}

export function getCtaDismissalRate(behavior: UserBehavior): number {
  if (behavior.totalCtaSeen === 0) return 0;
  return Math.round((behavior.totalCtaDismissed / behavior.totalCtaSeen) * 100) / 100;
}

// Export defaults for testing
export { DEFAULT_BEHAVIOR };
