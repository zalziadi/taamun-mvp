import { describe, it, expect } from "vitest";
import { attachDecision, computeConfidence, deriveSource } from "./decisionLayer";
import type { ProgressState } from "./progressEngine";
import type { CognitiveAction } from "./actionGenerator";

const makeProgress = (overrides: Partial<ProgressState> = {}): ProgressState => ({
  currentDay: 6, storedDay: 6, calendarDay: 6, drift: 0, mode: "normal",
  completedDays: [1, 2, 3, 4, 5, 6], missedDays: [], streak: 6, completionRate: 1,
  momentum: 5, emotionalDrift: "low", ...overrides,
});

const makeAction = (overrides: Partial<CognitiveAction> = {}): CognitiveAction => ({
  type: "practice", label: "test", description: "test", suggestedNextStep: "test",
  priority: "low", ...overrides,
});

describe("computeConfidence", () => {
  it("base confidence around 0.5", () => {
    const c = computeConfidence(makeProgress(), null, makeAction());
    expect(c).toBeGreaterThanOrEqual(0.3);
    expect(c).toBeLessThanOrEqual(1);
  });

  it("reduces confidence with high drift", () => {
    const normal = computeConfidence(makeProgress(), null, makeAction());
    const drifted = computeConfidence(makeProgress({ drift: 7 }), null, makeAction());
    expect(drifted).toBeLessThan(normal);
  });

  it("increases confidence with long streak", () => {
    const short = computeConfidence(makeProgress({ streak: 1, completedDays: [1] }), null, makeAction());
    const long = computeConfidence(makeProgress({ streak: 5, completedDays: [1,2,3,4,5,6,7,8] }), null, makeAction());
    expect(long).toBeGreaterThan(short);
  });
});

describe("deriveSource", () => {
  it("returns hybrid for decision actions", () => {
    expect(deriveSource(makeAction({ type: "decision" }), null)).toBe("hybrid");
  });

  it("returns system for practice actions", () => {
    expect(deriveSource(makeAction({ type: "practice" }), null)).toBe("system");
  });
});

describe("attachDecision", () => {
  it("attaches decision to action", () => {
    const result = attachDecision(makeAction(), makeProgress());
    expect(result.decision).toBeDefined();
    expect(result.decision.source).toBe("system");
    expect(result.decision.overrideAllowed).toBe(true);
    expect(result.decision.reasoning).toBeTruthy();
    expect(result.decision.confidence).toBeGreaterThan(0);
  });
});
