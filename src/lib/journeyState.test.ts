import { describe, it, expect } from "vitest";
import { buildJourneyState, classifyDepth } from "./journeyState";
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
  momentum: 5,
  emotionalDrift: "low",
  ...overrides,
});

describe("classifyDepth", () => {
  it("returns none for 0", () => expect(classifyDepth(0)).toBe("none"));
  it("returns short for < 50", () => expect(classifyDepth(30)).toBe("short"));
  it("returns medium for 50-199", () => expect(classifyDepth(100)).toBe("medium"));
  it("returns deep for >= 200", () => expect(classifyDepth(250)).toBe("deep"));
});

describe("buildJourneyState", () => {
  it("returns flow mode for normal progress", () => {
    const state = buildJourneyState({
      progress: makeProgress(),
      reflectionCount: 3,
      lastReflectionDepth: "medium",
      actionsCompletedRecently: 0,
      daysSinceLastReflection: 2,
    });
    expect(state.currentMode).toBe("flow");
    expect(state.riskLevel).toBe("low");
  });

  it("returns recovery mode when intervention", () => {
    const state = buildJourneyState({
      progress: makeProgress({ mode: "intervention", drift: 7, missedDays: [2, 3, 4, 5, 6, 7] }),
      reflectionCount: 0,
      lastReflectionDepth: "none",
      actionsCompletedRecently: 0,
      daysSinceLastReflection: 8,
    });
    expect(state.currentMode).toBe("recovery");
    expect(state.emotionalState).toBe("lost");
    expect(state.riskLevel).toBe("high");
  });

  it("returns breakthrough when deep reflection + actions", () => {
    const state = buildJourneyState({
      progress: makeProgress(),
      reflectionCount: 5,
      lastReflectionDepth: "deep",
      actionsCompletedRecently: 2,
      daysSinceLastReflection: 0,
    });
    expect(state.currentMode).toBe("breakthrough");
  });
});
