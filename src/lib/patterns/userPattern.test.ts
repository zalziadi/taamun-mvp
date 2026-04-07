import { describe, it, expect } from "vitest";
import {
  getUserPattern,
  getPatternMultiplier,
  calcDecisionResistance,
  calcReflectionAffinity,
  normalizeSpeed,
  computeConfidence,
} from "./userPattern";
import { DEFAULT_BEHAVIOR, type UserBehavior } from "../behavior/userBehavior";

const baseBehavior = (o: Partial<UserBehavior> = {}): UserBehavior => ({
  ...DEFAULT_BEHAVIOR,
  ...o,
});

describe("normalizeSpeed", () => {
  it("returns 1.0 for instant actions (≤30s)", () => {
    expect(normalizeSpeed(20)).toBe(1);
    expect(normalizeSpeed(0)).toBe(0.5); // 0 = no data
  });

  it("returns 0 for slow actions (≥300s)", () => {
    expect(normalizeSpeed(300)).toBe(0);
    expect(normalizeSpeed(500)).toBe(0);
  });

  it("decreases linearly between 30 and 300", () => {
    const mid = normalizeSpeed(165);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});

describe("calcDecisionResistance", () => {
  it("returns 0.5 baseline for new user", () => {
    expect(calcDecisionResistance(baseBehavior())).toBe(0.5);
  });

  it("rises with high dismissal rate", () => {
    const b = baseBehavior({
      decisionClicks: 1,
      totalCtaSeen: 5,
      totalCtaDismissed: 4,
    });
    expect(calcDecisionResistance(b)).toBeGreaterThan(0.3);
  });
});

describe("calcReflectionAffinity", () => {
  it("returns high affinity for many reflections", () => {
    expect(calcReflectionAffinity(baseBehavior({ reflectionEngagement: 8 }))).toBeGreaterThan(0.7);
  });

  it("returns low affinity for none", () => {
    expect(calcReflectionAffinity(baseBehavior({ reflectionEngagement: 0 }))).toBeLessThanOrEqual(0.5);
  });
});

describe("computeConfidence", () => {
  it("low confidence for empty behavior", () => {
    expect(computeConfidence(baseBehavior())).toBeLessThan(0.5);
  });

  it("high confidence for rich data", () => {
    const rich = baseBehavior({
      lastInteractions: Array(20).fill("page_visit"),
      speedSamples: [10, 20, 30, 40],
      decisionClicks: 5,
      totalCtaSeen: 5,
      reflectionEngagement: 5,
    });
    expect(computeConfidence(rich)).toBeGreaterThan(0.7);
  });
});

describe("getUserPattern — pattern detection", () => {
  it("returns 'avoidant' for high resistance + few clicks", () => {
    const b = baseBehavior({
      decisionClicks: 0,
      totalCtaSeen: 5,
      totalCtaDismissed: 4,
      backNavigationCount: 6,
    });
    const pattern = getUserPattern(b);
    expect(pattern.type).toBe("avoidant");
  });

  it("returns 'decisive' for fast actions + low resistance + clicks", () => {
    const b = baseBehavior({
      decisionClicks: 4,
      actionSpeedAvg: 15,
      speedSamples: [15, 20, 10],
      totalCtaSeen: 4,
      totalCtaDismissed: 0,
    });
    const pattern = getUserPattern(b);
    expect(pattern.type).toBe("decisive");
  });

  it("returns 'explorer' for high reflection engagement", () => {
    const b = baseBehavior({
      reflectionEngagement: 8,
      decisionClicks: 1,
      actionSpeedAvg: 60,
      speedSamples: [60, 90],
    });
    const pattern = getUserPattern(b);
    expect(pattern.type).toBe("explorer");
  });

  it("returns 'balanced' as default", () => {
    expect(getUserPattern(baseBehavior()).type).toBe("balanced");
  });
});

describe("getPatternMultiplier", () => {
  it("amplifies decision for avoidant users", () => {
    const pattern = { type: "avoidant" as const, decisionResistance: 0.8, reflectionAffinity: 0.3, actionSpeed: 0.4, confidence: 0.7, reasons: [] };
    expect(getPatternMultiplier(pattern, "decision")).toBeGreaterThan(1);
  });

  it("softens decision for decisive users", () => {
    const pattern = { type: "decisive" as const, decisionResistance: 0.2, reflectionAffinity: 0.5, actionSpeed: 0.9, confidence: 0.7, reasons: [] };
    expect(getPatternMultiplier(pattern, "decision")).toBeLessThan(1);
  });

  it("boosts reflection for explorers", () => {
    const pattern = { type: "explorer" as const, decisionResistance: 0.4, reflectionAffinity: 0.9, actionSpeed: 0.5, confidence: 0.7, reasons: [] };
    expect(getPatternMultiplier(pattern, "reflection")).toBeGreaterThan(1);
  });

  it("returns 1.0 for balanced", () => {
    const pattern = { type: "balanced" as const, decisionResistance: 0.5, reflectionAffinity: 0.5, actionSpeed: 0.5, confidence: 0.5, reasons: [] };
    expect(getPatternMultiplier(pattern, "decision")).toBe(1);
    expect(getPatternMultiplier(pattern, "reflection")).toBe(1);
  });
});
