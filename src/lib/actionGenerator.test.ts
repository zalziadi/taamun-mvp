import { describe, it, expect } from "vitest";
import { generateAction } from "./actionGenerator";
import type { ProgressState } from "./progressEngine";

const makeProgress = (overrides: Partial<ProgressState> = {}): ProgressState => ({
  currentDay: 6,
  storedDay: 6,
  calendarDay: 6,
  drift: 0,
  mode: "normal",
  completedDays: [1, 2, 3, 4, 5, 6],
  missedDays: [],
  streak: 6,
  completionRate: 1,
  ...overrides,
});

describe("generateAction", () => {
  it("returns decision action for intervention mode", () => {
    const action = generateAction(makeProgress({ mode: "intervention", drift: 7 }), null);
    expect(action.type).toBe("decision");
    expect(action.priority).toBe("high");
  });

  it("returns review action for catch_up mode", () => {
    const action = generateAction(makeProgress({ mode: "catch_up", missedDays: [3, 4] }), null);
    expect(action.type).toBe("review");
    expect(action.label).toContain("3");
  });

  it("returns recovery_boost action", () => {
    const action = generateAction(makeProgress({ mode: "recovery_boost" }), null);
    expect(action.type).toBe("practice");
    expect(action.label).toContain("زخم");
  });

  it("returns reflection action for recurring patterns", () => {
    const linked = {
      insight: "test",
      connectedDays: [2],
      emotionalArc: "deepening" as const,
      patterns: [{ keyword: "خوف", weight: 5, firstSeenDay: 1, recurrence: 4, type: "emotional" as const }],
    };
    const action = generateAction(makeProgress(), linked);
    expect(action.type).toBe("reflection");
    expect(action.priority).toBe("high");
  });

  it("returns default practice when no signals", () => {
    const action = generateAction(makeProgress(), null);
    expect(action.type).toBe("practice");
    expect(action.priority).toBe("low");
  });
});
