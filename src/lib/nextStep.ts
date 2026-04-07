/**
 * Next Best Action Engine
 *
 * Pure function. Takes user context and returns the single best
 * "what's next" action. Used everywhere there's a risk of dead-end.
 *
 * V7: Behavior-aware scoring
 * - basePriority is multiplied by behaviorMultiplier from user pattern
 * - Avoidant users get amplified decision priority
 * - Decisive users get softened decision priority + boosted reflection
 */

import type { UserBehavior } from "./behavior/userBehavior";
import type { UserPattern } from "./patterns/userPattern";
import { getPatternMultiplier } from "./patterns/userPattern";

export type NextActionType =
  | "decision"
  | "next_day"
  | "continue_day"
  | "reflection"
  | "city"
  | "journey"
  | "program"
  | "home";

export interface NextAction {
  type: NextActionType;
  label: string;
  route: string;
  priority: number;       // higher = more urgent
  reason: string;
  emphasis: "high" | "medium" | "low";
}

export interface NextStepContext {
  // Required
  currentDay: number;
  totalDays: number;

  // Optional flags
  flowLockEnabled?: boolean;
  decisionTriggered?: boolean;
  hasCompletedToday?: boolean;
  hasUnfinishedDay?: boolean;
  hasNarrativeMemory?: boolean;
  hasReflections?: boolean;

  // Source page (so we don't suggest the page user is on)
  fromPage?: "reflection" | "program" | "day" | "journey" | "city" | "home";

  // V7: Behavior-aware scoring
  behavior?: UserBehavior | null;
  pattern?: UserPattern | null;
}

const TOTAL_DAYS = 28;

export function getNextBestAction(ctx: NextStepContext): NextAction {
  const total = ctx.totalDays || TOTAL_DAYS;

  // 1. DECISION takes ALL priority — flow is locked
  if (ctx.flowLockEnabled || ctx.decisionTriggered) {
    return {
      type: "decision",
      label: "اتخذ القرار الآن",
      route: "/decision",
      priority: 200,
      reason: "وقت القرار — كل شيء آخر ينتظر",
      emphasis: "high",
    };
  }

  // 2. If user has unfinished day → continue
  if (ctx.hasUnfinishedDay && ctx.fromPage !== "day") {
    return {
      type: "continue_day",
      label: `تابع يوم ${ctx.currentDay}`,
      route: `/program/day/${ctx.currentDay}`,
      priority: 100,
      reason: "يومك لم يكتمل بعد",
      emphasis: "high",
    };
  }

  // 3. If user just completed today → go to next day
  if (ctx.hasCompletedToday) {
    const nextDay = Math.min(total, ctx.currentDay + 1);
    if (nextDay <= total && ctx.fromPage !== "day") {
      return {
        type: "next_day",
        label: `تابع يومك (${nextDay})`,
        route: `/program/day/${nextDay}`,
        priority: 80,
        reason: "اليوم مكتمل — استمر",
        emphasis: "high",
      };
    }
  }

  // 4. From reflection → encourage exploration
  if (ctx.fromPage === "reflection") {
    return {
      type: "next_day",
      label: `تابع يومك`,
      route: `/program/day/${ctx.currentDay}`,
      priority: 70,
      reason: "احفظ الزخم",
      emphasis: "high",
    };
  }

  // 5. From journey → city (deepen the experience)
  if (ctx.fromPage === "journey") {
    return {
      type: "city",
      label: "ادخل مدينتك",
      route: "/city",
      priority: 60,
      reason: "شوف وين أنت",
      emphasis: "medium",
    };
  }

  // 6. From city → journey (reflect on the path)
  if (ctx.fromPage === "city") {
    return {
      type: "journey",
      label: "اقرأ رحلتك",
      route: "/journey",
      priority: 60,
      reason: "تابع تطورك",
      emphasis: "medium",
    };
  }

  // 7. From day page → suggest reflection (not loop back to same day)
  if (ctx.fromPage === "day") {
    return {
      type: "reflection",
      label: "افتح التمعّن",
      route: "/reflection",
      priority: 50,
      reason: "حوّل اليوم إلى وعي",
      emphasis: "medium",
    };
  }

  // 8. Default fallback — guide toward today
  return {
    type: "continue_day",
    label: `تابع يومك (${ctx.currentDay})`,
    route: `/program/day/${ctx.currentDay}`,
    priority: 50,
    reason: "اليوم بين يديك",
    emphasis: "medium",
  };
}

/**
 * V7: Apply behavior-aware multiplier to action priority.
 * Used internally when ranking + filtering alternatives.
 */
function applyBehaviorMultiplier(action: NextAction, pattern: UserPattern | null | undefined): NextAction {
  if (!pattern) return action;
  const multiplier = getPatternMultiplier(pattern, action.type);
  return {
    ...action,
    priority: Math.round(action.priority * multiplier),
  };
}

/**
 * Returns up to 3 alternative actions for a multi-option panel.
 * Always at least 1 action (the primary one).
 *
 * V7: Behavior-aware
 * - Avoidant users see fewer options (max 1) to reduce decision fatigue
 * - Decisive users see all 3 alternatives for breadth
 * - Pattern multiplier reorders alternatives
 */
export function getNextStepOptions(ctx: NextStepContext): NextAction[] {
  const primary = getNextBestAction(ctx);

  // If decision is locked, ONLY show decision (flow lock is sacred)
  if (primary.type === "decision") return [primary];

  // V7: Avoidant users → only show ONE clear option (reduce friction)
  if (ctx.pattern?.type === "avoidant") {
    return [primary];
  }

  // Build alternatives from non-current pages
  const nextDay = Math.min(ctx.totalDays || TOTAL_DAYS, ctx.currentDay + 1);

  const candidates: NextAction[] = [
    {
      type: "next_day",
      label: `تابع يومك (${nextDay})`,
      route: `/program/day/${nextDay}`,
      priority: 80,
      reason: "احفظ الزخم",
      emphasis: "high",
    },
    {
      type: "city",
      label: "ادخل مدينتك",
      route: "/city",
      priority: 60,
      reason: "شوف 9 مناطق وعيك",
      emphasis: "medium",
    },
    {
      type: "journey",
      label: "اقرأ رحلتك",
      route: "/journey",
      priority: 50,
      reason: "تابع تطورك عبر الأيام",
      emphasis: "medium",
    },
  ];

  // Filter out the page user is currently on
  let filtered = candidates.filter((a) => {
    if (ctx.fromPage === "city" && a.type === "city") return false;
    if (ctx.fromPage === "journey" && a.type === "journey") return false;
    if (a.type === primary.type) return false; // don't duplicate primary
    return true;
  });

  // V7: Apply pattern multiplier and re-sort
  if (ctx.pattern) {
    filtered = filtered
      .map((a) => applyBehaviorMultiplier(a, ctx.pattern))
      .sort((a, b) => b.priority - a.priority);
  }

  // V7: Decisive users get 3 alternatives, others get 2
  const altCount = ctx.pattern?.type === "decisive" ? 3 : 2;
  return [primary, ...filtered.slice(0, altCount)];
}
