/**
 * System Brain Layer
 *
 * A unified decision engine that sits ABOVE the orchestrator and
 * provides a SINGLE simple decision for the entire app.
 *
 * Philosophy:
 *   The user must never wonder "what do I do next?"
 *   The brain always has an answer: ONE primary action + ONE line message.
 *
 * Pure function — no side effects, no React imports.
 * Used by: SearchBox, /progress, /city, NextStepPanel, AppChrome.
 */

import type { PatternType } from "@/lib/patterns/userPattern";

// ── Types ──

export type UserStateKind =
  | "new"           // hasn't started the journey
  | "lost"          // high drift or emotionally lost
  | "imbalanced"    // strong zone energy gap
  | "active"        // in flow, momentum high
  | "search"        // search query present → override
  | "balanced";     // default neutral state

export type ActionType =
  | "day"           // /program/day/[id]
  | "zone"          // /city (optionally with zone focus)
  | "tool"          // /decision, /breathing, /guide
  | "reflection"    // /reflection
  | "review"        // /program
  | "journey";      // /journey

export interface SystemAction {
  type: ActionType;
  target: string;   // route
  label: string;    // Arabic label for buttons
}

export interface SystemDecision {
  caseName: UserStateKind;
  primaryAction: SystemAction;
  message: string;              // ≤ 1 line Arabic
  secondaryActions: SystemAction[]; // max 2
  uiHints: {
    highlightZone?: string;
    showToast?: string;
    lockFlow?: boolean;
  };
  reason: string;               // for debugging + transparency
}

export interface BrainZone {
  id: string;
  name: string;
  state: "weak" | "growing" | "stable" | "thriving";
  energy: number;
}

export interface SystemContext {
  userPattern?: PatternType | null;

  progress: {
    hasStarted: boolean;
    currentDay: number;
    streak: number;
    momentum: number;
    drift: number;
    completedCount?: number;
  };

  city?: {
    dominantZone: string | null;
    weakestZone: string | null;
    zones?: BrainZone[];
  } | null;

  lastActivity?: {
    type: "reflection" | "decision" | "city" | "day" | "none";
    timestamp: number;
    daysSince?: number;
  } | null;

  searchQuery?: string;
  emotionalState?: "engaged" | "neutral" | "lost";
}

// ── Constants ──

const ZONE_ENERGY_GAP_THRESHOLD = 35;     // difference between strongest and weakest
const DRIFT_LOST_THRESHOLD = 3;
const MOMENTUM_FLOW_THRESHOLD = 5;
const STREAK_FLOW_THRESHOLD = 3;

// ── Helper: detectUserState ──

export function detectUserState(ctx: SystemContext): UserStateKind {
  // Search overrides all — handled separately via generateMessage
  if (ctx.searchQuery && ctx.searchQuery.trim().length > 0) {
    return "search";
  }

  // New user — never started
  if (!ctx.progress.hasStarted) {
    return "new";
  }

  // Lost — high drift or explicit emotional state
  if (ctx.progress.drift > DRIFT_LOST_THRESHOLD || ctx.emotionalState === "lost") {
    return "lost";
  }

  // Zone imbalance — big energy gap between dominant and weakest
  if (ctx.city?.weakestZone && ctx.city?.dominantZone && ctx.city?.zones?.length) {
    const weakest = ctx.city.zones.find((z) => z.id === ctx.city!.weakestZone);
    const dominant = ctx.city.zones.find((z) => z.id === ctx.city!.dominantZone);
    if (weakest && dominant) {
      const gap = dominant.energy - weakest.energy;
      if (gap >= ZONE_ENERGY_GAP_THRESHOLD) {
        return "imbalanced";
      }
    }
  }

  // Active flow — high momentum + good streak
  if (ctx.progress.momentum >= MOMENTUM_FLOW_THRESHOLD && ctx.progress.streak >= STREAK_FLOW_THRESHOLD) {
    return "active";
  }

  return "balanced";
}

// ── Helper: pickPrimaryAction ──

const TOTAL_DAYS = 28;

export function pickPrimaryAction(state: UserStateKind, ctx: SystemContext): SystemAction {
  const currentDay = Math.max(1, Math.min(TOTAL_DAYS, ctx.progress.currentDay || 1));
  const nextDay = Math.min(TOTAL_DAYS, currentDay + 1);

  switch (state) {
    case "new":
      return {
        type: "day",
        target: "/program/day/1",
        label: "ابدأ اليوم الأول",
      };

    case "lost":
      // Avoidant users: softer fallback to breathing
      if (ctx.userPattern === "avoidant") {
        return { type: "tool", target: "/breathing", label: "خذ نفساً عميقاً" };
      }
      return { type: "tool", target: "/decision", label: "افتح وضع القرار" };

    case "imbalanced":
      return {
        type: "zone",
        target: `/city${ctx.city?.weakestZone ? `?focus=${ctx.city.weakestZone}` : ""}`,
        label: "ادخل منطقتك اليوم",
      };

    case "active":
      return {
        type: "day",
        target: `/program/day/${nextDay}`,
        label: `تابع يومك (${nextDay})`,
      };

    case "search":
      // Search override: jump to program as safe default (SearchBox will enrich)
      return { type: "review", target: "/program", label: "اذهب للبرنامج" };

    case "balanced":
    default:
      return {
        type: "day",
        target: `/program/day/${currentDay}`,
        label: `يومك (${currentDay})`,
      };
  }
}

// ── Helper: pickSecondaryActions ──

export function pickSecondaryActions(state: UserStateKind, ctx: SystemContext): SystemAction[] {
  // Avoidant users: only primary, no secondaries (reduce friction)
  if (ctx.userPattern === "avoidant") return [];

  const actions: SystemAction[] = [];

  switch (state) {
    case "new":
      actions.push({ type: "review", target: "/program", label: "شوف الرحلة" });
      break;

    case "lost":
      actions.push({ type: "reflection", target: "/reflection", label: "اكتب ما تشعر" });
      actions.push({ type: "journey", target: "/journey", label: "شوف رحلتك" });
      break;

    case "imbalanced":
      actions.push({
        type: "day",
        target: `/program/day/${ctx.progress.currentDay}`,
        label: "يومك الحالي",
      });
      actions.push({ type: "reflection", target: "/reflection", label: "افتح التمعّن" });
      break;

    case "active":
      actions.push({ type: "zone", target: "/city", label: "ادخل المدينة" });
      actions.push({ type: "journey", target: "/journey", label: "اقرأ رحلتك" });
      break;

    case "balanced":
    default:
      actions.push({ type: "zone", target: "/city", label: "ادخل المدينة" });
      actions.push({ type: "reflection", target: "/reflection", label: "اكتب تمعّن" });
      break;
  }

  // Decisive users get all (max 2); others get max 1
  const max = ctx.userPattern === "decisive" ? 2 : 1;
  return actions.slice(0, max);
}

// ── Helper: generateMessage ──

const MESSAGES: Record<UserStateKind, Record<PatternType | "default", string>> = {
  new: {
    avoidant: "خطوة واحدة فقط اليوم",
    decisive: "ابدأ الآن — يومك الأول ينتظر",
    explorer: "كل رحلة تبدأ بنية صادقة — نيتك الآن؟",
    balanced: "لنبدأ رحلتك من أول خطوة",
    default: "لنبدأ رحلتك من أول خطوة",
  },
  lost: {
    avoidant: "خذ وقتك — لحظة هدوء تكفي",
    decisive: "واضح أنك تحتاج وضوح — افتح القرار",
    explorer: "التيه ليس فشلاً، هو إشارة قرار",
    balanced: "واضح أنك تحتاج وضوح الآن",
    default: "واضح أنك تحتاج وضوح الآن",
  },
  imbalanced: {
    avoidant: "منطقة واحدة — فقط هذه",
    decisive: "هذه منطقتك اليوم — افتحها",
    explorer: "هذه المنطقة تحاول أن تُرى — ادخلها",
    balanced: "هذه منطقتك اليوم",
    default: "هذه منطقتك اليوم",
  },
  active: {
    avoidant: "استمر — بلا ضغط",
    decisive: "الزخم قوي — لا تتوقف",
    explorer: "أنت في تدفق — ما الذي تراه الآن؟",
    balanced: "استمر… أنت في تدفق",
    default: "استمر… أنت في تدفق",
  },
  search: {
    avoidant: "ابحث عن خطوتك",
    decisive: "ما الذي تبحث عنه؟",
    explorer: "ما الكلمة التي تقودك؟",
    balanced: "ابحث في رحلتك",
    default: "ابحث في رحلتك",
  },
  balanced: {
    avoidant: "اليوم بين يديك",
    decisive: "يوم جديد — افتحه",
    explorer: "كل يوم يحمل معنى — ما معناك اليوم؟",
    balanced: "اليوم بين يديك",
    default: "اليوم بين يديك",
  },
};

export function generateMessage(state: UserStateKind, ctx: SystemContext): string {
  const pattern = ctx.userPattern ?? "balanced";
  const key = (pattern in MESSAGES[state] ? pattern : "default") as PatternType | "default";
  return MESSAGES[state][key];
}

// ── Helper: generateReason ──

function generateReason(state: UserStateKind, ctx: SystemContext): string {
  switch (state) {
    case "new":
      return "المستخدم لم يبدأ الرحلة بعد";
    case "lost":
      return `drift=${ctx.progress.drift}, emotional=${ctx.emotionalState ?? "n/a"}`;
    case "imbalanced":
      return `ضعف في ${ctx.city?.weakestZone}, قوة في ${ctx.city?.dominantZone}`;
    case "active":
      return `momentum=${ctx.progress.momentum}, streak=${ctx.progress.streak}`;
    case "search":
      return `بحث: ${ctx.searchQuery}`;
    case "balanced":
    default:
      return "حالة متوازنة — لا إشارات حرجة";
  }
}

// ── UI Hints ──

function pickUIHints(state: UserStateKind, ctx: SystemContext): SystemDecision["uiHints"] {
  const hints: SystemDecision["uiHints"] = {};

  if (state === "imbalanced" && ctx.city?.weakestZone) {
    hints.highlightZone = ctx.city.weakestZone;
    hints.showToast = "هذه منطقتك اليوم";
  }

  if (state === "active" && ctx.city?.dominantZone) {
    hints.highlightZone = ctx.city.dominantZone;
  }

  if (state === "lost") {
    hints.lockFlow = true;
  }

  return hints;
}

// ── Main ──

export function resolveSystemState(ctx: SystemContext): SystemDecision {
  const state = detectUserState(ctx);
  const primaryAction = pickPrimaryAction(state, ctx);
  const secondaryActions = pickSecondaryActions(state, ctx);
  const message = generateMessage(state, ctx);
  const uiHints = pickUIHints(state, ctx);
  const reason = generateReason(state, ctx);

  return {
    caseName: state,
    primaryAction,
    message,
    secondaryActions,
    uiHints,
    reason,
  };
}

// ── Convenience: safe context builder with sensible defaults ──

export function makeContext(partial: Partial<SystemContext> & { progress: SystemContext["progress"] }): SystemContext {
  return {
    userPattern: partial.userPattern ?? "balanced",
    progress: partial.progress,
    city: partial.city ?? null,
    lastActivity: partial.lastActivity ?? null,
    searchQuery: partial.searchQuery,
    emotionalState: partial.emotionalState ?? "neutral",
  };
}
