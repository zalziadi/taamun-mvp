/**
 * Journey Memory — Continuity Engine
 *
 * The user never starts over. They only continue.
 *
 * This module maintains a structured UserJourneyState per user,
 * loads it on every page entry, and persists updates after every
 * meaningful interaction.
 *
 * Pure module — no React imports, no side effects beyond localStorage
 * (which is guarded for SSR).
 *
 * Storage strategy:
 *   - Client: localStorage (instant read/write, survives refresh)
 *   - Server: user_memory.identity.journey_state (JSONB, cross-device)
 *
 * Philosophy:
 *   "User enters → System remembers → Journey continues"
 */

// ── Types ──

export type EmotionalState =
  | "flow"
  | "resistance"
  | "avoidant"
  | "clear"
  | "uncertain";

export type JourneyPhase =
  | "entry"          // day 1-7 (الظل)
  | "deepening"      // day 8-14 (الهدية)
  | "integrating"    // day 15-21 (gift integrated)
  | "mastery";       // day 22-28 (siddhi/highest potential)

export interface UserJourneyState {
  userId: string;

  // ── Current Position ──
  currentDay: number;           // 1-28
  currentPhase: JourneyPhase;
  currentZone: string;          // e.g. "identity", "discipline"

  // ── Progress ──
  progressScore: number;        // 0-100 cumulative
  completedSteps: string[];     // "day_1", "reflection_5", "zone_identity", etc.

  // ── Psychological Signals ──
  emotionalState: EmotionalState;
  energyLevel: number;          // 0-1

  // ── Memory ──
  lastQuestion: string | null;
  lastAnswer: string | null;
  keyInsights: string[];        // max 10, most recent first

  // ── Behavior Patterns ──
  drift: number;                // 0-28 days
  momentum: number;             // -10 to +10
  resistance: number;           // 0-1

  // ── Predictions ──
  predictedNextState?: EmotionalState | null;

  // ── Meta ──
  createdAt: string;            // ISO first visit
  updatedAt: string;            // ISO last update
  lastPageVisited: string | null;
  sessionCount: number;
}

// ── Constants ──

const STORAGE_KEY = "taamun.journey.state.v1";
const MAX_INSIGHTS = 10;
const MAX_COMPLETED_STEPS = 200;

// ── Helpers ──

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function phaseFromDay(day: number): JourneyPhase {
  if (day <= 7) return "entry";
  if (day <= 14) return "deepening";
  if (day <= 21) return "integrating";
  return "mastery";
}

// ── Default State ──

export function createDefaultState(userId: string): UserJourneyState {
  const now = new Date().toISOString();
  return {
    userId,
    currentDay: 1,
    currentPhase: "entry",
    currentZone: "identity",
    progressScore: 0,
    completedSteps: [],
    emotionalState: "uncertain",
    energyLevel: 0.5,
    lastQuestion: null,
    lastAnswer: null,
    keyInsights: [],
    drift: 0,
    momentum: 0,
    resistance: 0,
    predictedNextState: null,
    createdAt: now,
    updatedAt: now,
    lastPageVisited: null,
    sessionCount: 0,
  };
}

// ── Normalizer ──

export function normalizeJourneyState(
  input: Partial<UserJourneyState> | null | undefined,
  userId: string = "anonymous"
): UserJourneyState {
  const defaults = createDefaultState(userId);
  if (!input) return defaults;

  return {
    userId: input.userId ?? userId,
    currentDay: clampDay(input.currentDay ?? 1),
    currentPhase: input.currentPhase ?? phaseFromDay(input.currentDay ?? 1),
    currentZone: input.currentZone ?? "identity",
    progressScore: clamp(input.progressScore ?? 0, 0, 100),
    completedSteps: (input.completedSteps ?? []).slice(-MAX_COMPLETED_STEPS),
    emotionalState: input.emotionalState ?? "uncertain",
    energyLevel: clamp(input.energyLevel ?? 0.5, 0, 1),
    lastQuestion: input.lastQuestion ?? null,
    lastAnswer: input.lastAnswer ?? null,
    keyInsights: (input.keyInsights ?? []).slice(0, MAX_INSIGHTS),
    drift: Math.max(0, input.drift ?? 0),
    momentum: clamp(input.momentum ?? 0, -10, 10),
    resistance: clamp(input.resistance ?? 0, 0, 1),
    predictedNextState: input.predictedNextState ?? null,
    createdAt: input.createdAt ?? defaults.createdAt,
    updatedAt: input.updatedAt ?? defaults.updatedAt,
    lastPageVisited: input.lastPageVisited ?? null,
    sessionCount: Math.max(0, input.sessionCount ?? 0),
  };
}

function clampDay(d: number): number {
  return Math.max(1, Math.min(28, Math.round(d)));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ── localStorage I/O (client-side) ──

export function loadLocalJourneyState(userId: string = "anonymous"): UserJourneyState {
  if (!isBrowser()) return createDefaultState(userId);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState(userId);
    const parsed = JSON.parse(raw) as Partial<UserJourneyState>;
    return normalizeJourneyState(parsed, userId);
  } catch {
    return createDefaultState(userId);
  }
}

export function saveLocalJourneyState(state: UserJourneyState): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or storage disabled — silent fail
  }
}

export function clearLocalJourneyState(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ── Update (pure) ──

export interface JourneyStatePatch {
  currentDay?: number;
  currentZone?: string;
  completedStep?: string;         // convenience: appends to completedSteps
  emotionalState?: EmotionalState;
  energyLevel?: number;
  lastQuestion?: string | null;
  lastAnswer?: string | null;
  addInsight?: string;            // convenience: prepends to keyInsights
  drift?: number;
  momentum?: number;
  resistance?: number;
  lastPageVisited?: string;
  incrementSession?: boolean;
  progressDelta?: number;         // adds to progressScore
}

/**
 * Pure update function — takes state + patch, returns new state.
 * Auto-derives: phase from day, updatedAt, progress score increment.
 */
export function updateJourneyState(
  current: UserJourneyState,
  patch: JourneyStatePatch
): UserJourneyState {
  const next: UserJourneyState = { ...current };

  // Day + phase sync
  if (typeof patch.currentDay === "number") {
    next.currentDay = clampDay(patch.currentDay);
    next.currentPhase = phaseFromDay(next.currentDay);
  }

  if (patch.currentZone) next.currentZone = patch.currentZone;

  // Append completed step
  if (patch.completedStep) {
    if (!next.completedSteps.includes(patch.completedStep)) {
      next.completedSteps = [...next.completedSteps, patch.completedStep]
        .slice(-MAX_COMPLETED_STEPS);
    }
  }

  // Psych signals
  if (patch.emotionalState) next.emotionalState = patch.emotionalState;
  if (typeof patch.energyLevel === "number") {
    next.energyLevel = clamp(patch.energyLevel, 0, 1);
  }

  // Memory
  if (patch.lastQuestion !== undefined) next.lastQuestion = patch.lastQuestion;
  if (patch.lastAnswer !== undefined) next.lastAnswer = patch.lastAnswer;

  // Insights (prepend, deduplicate, max 10)
  if (patch.addInsight && patch.addInsight.trim()) {
    const trimmed = patch.addInsight.trim();
    if (!next.keyInsights.includes(trimmed)) {
      next.keyInsights = [trimmed, ...next.keyInsights].slice(0, MAX_INSIGHTS);
    }
  }

  // Patterns
  if (typeof patch.drift === "number") next.drift = Math.max(0, patch.drift);
  if (typeof patch.momentum === "number") next.momentum = clamp(patch.momentum, -10, 10);
  if (typeof patch.resistance === "number") next.resistance = clamp(patch.resistance, 0, 1);

  // Progress score
  if (typeof patch.progressDelta === "number") {
    next.progressScore = clamp(next.progressScore + patch.progressDelta, 0, 100);
  }

  // Session tracking
  if (patch.lastPageVisited) next.lastPageVisited = patch.lastPageVisited;
  if (patch.incrementSession) next.sessionCount = next.sessionCount + 1;

  // Always refresh updatedAt
  next.updatedAt = new Date().toISOString();

  // Re-run prediction (simple heuristic)
  next.predictedNextState = predictNextEmotionalState(next);

  return next;
}

// ── Prediction ──

export function predictNextEmotionalState(state: UserJourneyState): EmotionalState {
  // High drift → resistance likely
  if (state.drift > 3) return "resistance";
  // Very high momentum → flow likely
  if (state.momentum >= 6 && state.resistance < 0.4) return "flow";
  // Low energy + high resistance → avoidant
  if (state.energyLevel < 0.3 && state.resistance > 0.6) return "avoidant";
  // Deep phase + many insights → clear
  if (state.keyInsights.length >= 3 && state.currentPhase !== "entry") return "clear";
  return "uncertain";
}

// ── Continuity Message Generator ──

export interface ContinuityMessage {
  title: string;          // e.g. "أهلاً"
  body: string;           // main continuation line
  anchor: string | null;  // the specific "you left off at X"
  cta: string;            // action label
  ctaRoute: string;       // where to continue
}

/**
 * Generates the "let's continue from where you left off" message.
 * Pure function — takes state, returns message.
 */
export function buildContinuityMessage(state: UserJourneyState): ContinuityMessage {
  // First-time user
  if (state.sessionCount === 0) {
    return {
      title: "أهلاً بك في رحلتك",
      body: "الرحلة تبدأ من حيث أنت — لا من الصفر",
      anchor: null,
      cta: "ابدأ يومك الأول",
      ctaRoute: "/program/day/1",
    };
  }

  // Has last answer — anchor to it
  if (state.lastAnswer) {
    const preview = state.lastAnswer.slice(0, 60);
    return {
      title: "أهلاً من جديد",
      body: `آخر مرة كتبت: "${preview}${state.lastAnswer.length > 60 ? "…" : ""}"`,
      anchor: preview,
      cta: "نكمّل من هنا",
      ctaRoute: state.lastPageVisited || `/program/day/${state.currentDay}`,
    };
  }

  // Has last question — anchor to it
  if (state.lastQuestion) {
    return {
      title: "نرجع من النقطة اللي وقفنا عندها",
      body: `السؤال: ${state.lastQuestion}`,
      anchor: state.lastQuestion,
      cta: "أكمل التمعّن",
      ctaRoute: "/reflection",
    };
  }

  // Has completed days — point to current
  if (state.completedSteps.length > 0) {
    return {
      title: "نكمّل الرحلة",
      body: `أنت في اليوم ${state.currentDay} — ${phaseLabel(state.currentPhase)}`,
      anchor: null,
      cta: `تابع يومك (${state.currentDay})`,
      ctaRoute: `/program/day/${state.currentDay}`,
    };
  }

  // Default — pick up where session left
  return {
    title: "رجعت",
    body: `أنت في اليوم ${state.currentDay}`,
    anchor: null,
    cta: "أكمل",
    ctaRoute: state.lastPageVisited || `/program/day/${state.currentDay}`,
  };
}

function phaseLabel(phase: JourneyPhase): string {
  switch (phase) {
    case "entry":       return "مرحلة الظل — بداية الوعي";
    case "deepening":   return "مرحلة الهدية — تعميق الملاحظة";
    case "integrating": return "مرحلة التكامل — دمج الوعي بالفعل";
    case "mastery":     return "مرحلة أفضل احتمال — الحالة الراسخة";
  }
}

// ── Continuity Check: is this a "fresh" or "returning" user? ──

export type SessionKind =
  | "first_visit"
  | "returning_same_day"
  | "returning_next_day"
  | "returning_after_break";

export function classifySession(state: UserJourneyState): SessionKind {
  if (state.sessionCount === 0) return "first_visit";

  const last = new Date(state.updatedAt).getTime();
  const now = Date.now();
  const hoursSince = (now - last) / (1000 * 60 * 60);

  if (hoursSince < 12) return "returning_same_day";
  if (hoursSince < 48) return "returning_next_day";
  return "returning_after_break";
}

// ── Merge server + client state (server wins on conflicts) ──

export function mergeStates(
  serverState: Partial<UserJourneyState> | null,
  clientState: UserJourneyState
): UserJourneyState {
  if (!serverState) return clientState;

  // Server is source of truth for user-specific immutable data
  // Client wins for local progress that may not have synced yet
  const serverUpdated = serverState.updatedAt ? new Date(serverState.updatedAt).getTime() : 0;
  const clientUpdated = new Date(clientState.updatedAt).getTime();

  // Prefer whichever is newer
  if (serverUpdated > clientUpdated) {
    return normalizeJourneyState(serverState, clientState.userId);
  }
  return clientState;
}

// Export constants for testing
export { STORAGE_KEY, MAX_INSIGHTS };
