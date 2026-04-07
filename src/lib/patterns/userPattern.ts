/**
 * User Pattern Engine
 *
 * Derives a high-level behavioral pattern from raw UserBehavior signals.
 * Pure function — deterministic, no side effects.
 *
 * Pattern types:
 * - decisive: clicks decisions fast, low resistance
 * - avoidant: skips decisions, dismisses CTAs, slow actions
 * - explorer: high reflection engagement, balanced speed
 * - balanced: no extreme signals
 */

import type { UserBehavior } from "../behavior/userBehavior";
import { getCtaDismissalRate } from "../behavior/userBehavior";

export type PatternType = "decisive" | "avoidant" | "explorer" | "balanced";

export interface UserPattern {
  type: PatternType;
  decisionResistance: number;       // 0-1
  reflectionAffinity: number;       // 0-1
  actionSpeed: number;              // 0-1 (1 = very fast)
  confidence: number;               // 0-1 (data sufficiency)
  reasons: string[];                // why this pattern was chosen
}

// ── Helpers ──

function normalizeSpeed(secondsAvg: number): number {
  // 0s → 1.0 (instant), 60s → 0.5, 300s+ → 0.0
  if (secondsAvg <= 0) return 0.5;
  if (secondsAvg >= 300) return 0;
  if (secondsAvg <= 30) return 1;
  return Math.max(0, Math.min(1, 1 - (secondsAvg - 30) / 270));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, Math.round(v * 100) / 100));
}

// ── Resistance calculation ──

function calcDecisionResistance(behavior: UserBehavior): number {
  const dismissalRate = getCtaDismissalRate(behavior);
  const skipCount = behavior.lastInteractions.filter((t) => t === "decision_skipped").length;
  const clickCount = behavior.decisionClicks;
  const total = skipCount + clickCount;

  // Neutral baseline only if we have ZERO data at all
  if (total === 0 && behavior.totalCtaSeen === 0 && behavior.backNavigationCount === 0) {
    return 0.5;
  }

  const skipRatio = total > 0 ? skipCount / total : 0;

  // Combine: dismissal rate (cumulative) + skip ratio (recent) + back navigation
  return clamp01(dismissalRate * 0.5 + skipRatio * 0.3 + (behavior.backNavigationCount > 5 ? 0.25 : 0));
}

// ── Reflection affinity ──

function calcReflectionAffinity(behavior: UserBehavior): number {
  const reflections = behavior.reflectionEngagement;
  const decisions = behavior.decisionClicks;

  if (reflections === 0 && decisions === 0) return 0.5;

  // Heavy reflection user
  if (reflections >= 5) return clamp01(0.7 + (reflections / 30));

  // Some reflection
  if (reflections >= 2) return clamp01(0.5 + (reflections / 20));

  return clamp01(reflections / 5);
}

// ── Pattern classification ──

function classifyPattern(
  resistance: number,
  affinity: number,
  speed: number,
  behavior: UserBehavior
): { type: PatternType; reasons: string[] } {
  const reasons: string[] = [];

  // Avoidant: high resistance + low/medium speed + low click rate
  if (resistance >= 0.6 && behavior.decisionClicks < 3) {
    reasons.push(`مقاومة عالية (${resistance})`);
    if (behavior.totalCtaDismissed > 2) reasons.push("تجاهل CTA متكرر");
    return { type: "avoidant", reasons };
  }

  // Decisive: fast actions + low resistance + several decision clicks
  if (speed >= 0.7 && resistance < 0.4 && behavior.decisionClicks >= 2) {
    reasons.push(`سرعة فعل عالية (${speed})`);
    reasons.push(`${behavior.decisionClicks} قرارات`);
    return { type: "decisive", reasons };
  }

  // Explorer: high reflection affinity, moderate speed
  if (affinity >= 0.6 && behavior.reflectionEngagement >= 3) {
    reasons.push(`تأملات متعددة (${behavior.reflectionEngagement})`);
    reasons.push("حضور عميق");
    return { type: "explorer", reasons };
  }

  // Default
  reasons.push("بيانات متوازنة — لا إشارات حادة");
  return { type: "balanced", reasons };
}

// ── Confidence ──

function computeConfidence(behavior: UserBehavior): number {
  const totalInteractions = behavior.lastInteractions.length;
  const speedSamples = behavior.speedSamples.length;
  const decisionData = behavior.decisionClicks + behavior.totalCtaSeen;

  let confidence = 0.2;
  if (totalInteractions >= 5) confidence += 0.2;
  if (totalInteractions >= 15) confidence += 0.2;
  if (speedSamples >= 3) confidence += 0.15;
  if (decisionData >= 3) confidence += 0.15;
  if (behavior.reflectionEngagement >= 2) confidence += 0.1;

  return clamp01(confidence);
}

// ── Main ──

export function getUserPattern(behavior: UserBehavior): UserPattern {
  const decisionResistance = calcDecisionResistance(behavior);
  const reflectionAffinity = calcReflectionAffinity(behavior);
  const actionSpeed = normalizeSpeed(behavior.actionSpeedAvg);
  const confidence = computeConfidence(behavior);

  const { type, reasons } = classifyPattern(decisionResistance, reflectionAffinity, actionSpeed, behavior);

  return {
    type,
    decisionResistance,
    reflectionAffinity,
    actionSpeed,
    confidence,
    reasons,
  };
}

// ── Pattern multipliers for scoring ──

/**
 * Returns a multiplier for action priority based on pattern.
 * Used by NextStep engine.
 */
export function getPatternMultiplier(pattern: UserPattern, actionType: string): number {
  if (pattern.type === "avoidant") {
    if (actionType === "decision") return 1.6;     // amplify decision urgency
    if (actionType === "reflection") return 0.7;   // de-emphasize reflection
    return 1.0;
  }

  if (pattern.type === "decisive") {
    if (actionType === "decision") return 0.8;     // user already acts fast — soften
    if (actionType === "reflection") return 1.2;   // encourage depth
    return 1.0;
  }

  if (pattern.type === "explorer") {
    if (actionType === "reflection") return 1.4;
    if (actionType === "city" || actionType === "journey") return 1.2;
    return 1.0;
  }

  return 1.0; // balanced — no adjustment
}

// Export internals for testing
export { calcDecisionResistance, calcReflectionAffinity, normalizeSpeed, classifyPattern, computeConfidence };
