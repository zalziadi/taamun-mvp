import { describe, it, expect } from "vitest";
import {
  createDefaultState,
  normalizeJourneyState,
  phaseFromDay,
  updateJourneyState,
  predictNextEmotionalState,
  buildContinuityMessage,
  classifySession,
  mergeStates,
  MAX_INSIGHTS,
} from "./memory";

const makeState = (overrides: Partial<ReturnType<typeof createDefaultState>> = {}) => {
  return { ...createDefaultState("user-1"), ...overrides };
};

// ── phaseFromDay ──

describe("phaseFromDay", () => {
  it("returns entry for days 1-7", () => {
    expect(phaseFromDay(1)).toBe("entry");
    expect(phaseFromDay(7)).toBe("entry");
  });

  it("returns deepening for days 8-14", () => {
    expect(phaseFromDay(8)).toBe("deepening");
    expect(phaseFromDay(14)).toBe("deepening");
  });

  it("returns integrating for days 15-21", () => {
    expect(phaseFromDay(15)).toBe("integrating");
    expect(phaseFromDay(21)).toBe("integrating");
  });

  it("returns mastery for days 22-28", () => {
    expect(phaseFromDay(22)).toBe("mastery");
    expect(phaseFromDay(28)).toBe("mastery");
  });
});

// ── createDefaultState ──

describe("createDefaultState", () => {
  it("returns complete state with defaults", () => {
    const state = createDefaultState("abc");
    expect(state.userId).toBe("abc");
    expect(state.currentDay).toBe(1);
    expect(state.currentPhase).toBe("entry");
    expect(state.sessionCount).toBe(0);
    expect(state.keyInsights).toEqual([]);
    expect(state.completedSteps).toEqual([]);
  });
});

// ── normalizeJourneyState ──

describe("normalizeJourneyState", () => {
  it("returns defaults for null input", () => {
    const state = normalizeJourneyState(null, "x");
    expect(state.userId).toBe("x");
    expect(state.currentDay).toBe(1);
  });

  it("clamps currentDay to 1-28", () => {
    expect(normalizeJourneyState({ currentDay: 50 }).currentDay).toBe(28);
    expect(normalizeJourneyState({ currentDay: -5 }).currentDay).toBe(1);
  });

  it("clamps momentum to -10..10", () => {
    expect(normalizeJourneyState({ momentum: 99 }).momentum).toBe(10);
    expect(normalizeJourneyState({ momentum: -99 }).momentum).toBe(-10);
  });

  it("clamps resistance to 0-1", () => {
    expect(normalizeJourneyState({ resistance: 5 }).resistance).toBe(1);
    expect(normalizeJourneyState({ resistance: -1 }).resistance).toBe(0);
  });

  it("caps keyInsights to MAX_INSIGHTS", () => {
    const many = Array.from({ length: 20 }, (_, i) => `insight ${i}`);
    const state = normalizeJourneyState({ keyInsights: many });
    expect(state.keyInsights).toHaveLength(MAX_INSIGHTS);
  });

  it("auto-derives phase from currentDay", () => {
    const state = normalizeJourneyState({ currentDay: 15 });
    expect(state.currentPhase).toBe("integrating");
  });
});

// ── updateJourneyState ──

describe("updateJourneyState", () => {
  it("applies currentDay patch and updates phase", () => {
    const next = updateJourneyState(makeState(), { currentDay: 10 });
    expect(next.currentDay).toBe(10);
    expect(next.currentPhase).toBe("deepening");
  });

  it("appends completedStep without duplicates", () => {
    let state = makeState();
    state = updateJourneyState(state, { completedStep: "day_1" });
    state = updateJourneyState(state, { completedStep: "day_1" }); // duplicate
    state = updateJourneyState(state, { completedStep: "day_2" });
    expect(state.completedSteps).toEqual(["day_1", "day_2"]);
  });

  it("prepends insights and deduplicates", () => {
    let state = makeState();
    state = updateJourneyState(state, { addInsight: "A" });
    state = updateJourneyState(state, { addInsight: "B" });
    state = updateJourneyState(state, { addInsight: "A" }); // duplicate
    expect(state.keyInsights).toEqual(["B", "A"]);
  });

  it("caps insights at MAX_INSIGHTS", () => {
    let state = makeState();
    for (let i = 0; i < 15; i++) {
      state = updateJourneyState(state, { addInsight: `insight-${i}` });
    }
    expect(state.keyInsights).toHaveLength(MAX_INSIGHTS);
    // Most recent should be at index 0
    expect(state.keyInsights[0]).toBe("insight-14");
  });

  it("increments session count", () => {
    const s1 = updateJourneyState(makeState(), { incrementSession: true });
    const s2 = updateJourneyState(s1, { incrementSession: true });
    expect(s2.sessionCount).toBe(2);
  });

  it("updates progressScore with delta", () => {
    let state = makeState({ progressScore: 50 });
    state = updateJourneyState(state, { progressDelta: 10 });
    expect(state.progressScore).toBe(60);
  });

  it("clamps progressScore at 100", () => {
    let state = makeState({ progressScore: 95 });
    state = updateJourneyState(state, { progressDelta: 50 });
    expect(state.progressScore).toBe(100);
  });

  it("refreshes updatedAt timestamp", () => {
    const before = makeState({ updatedAt: "2020-01-01T00:00:00.000Z" });
    const after = updateJourneyState(before, { lastAnswer: "test" });
    expect(after.updatedAt).not.toBe(before.updatedAt);
  });

  it("recomputes prediction on each update", () => {
    const state = updateJourneyState(makeState(), { drift: 5 });
    expect(state.predictedNextState).toBe("resistance");
  });
});

// ── predictNextEmotionalState ──

describe("predictNextEmotionalState", () => {
  it("predicts 'resistance' for high drift", () => {
    expect(predictNextEmotionalState(makeState({ drift: 5 }))).toBe("resistance");
  });

  it("predicts 'flow' for high momentum + low resistance", () => {
    expect(predictNextEmotionalState(makeState({ momentum: 7, resistance: 0.2 }))).toBe("flow");
  });

  it("predicts 'avoidant' for low energy + high resistance", () => {
    expect(
      predictNextEmotionalState(makeState({ energyLevel: 0.2, resistance: 0.8 }))
    ).toBe("avoidant");
  });

  it("predicts 'clear' for deep phase with many insights", () => {
    const state = makeState({
      currentDay: 15,
      currentPhase: "integrating",
      keyInsights: ["a", "b", "c", "d"],
    });
    expect(predictNextEmotionalState(state)).toBe("clear");
  });

  it("defaults to 'uncertain'", () => {
    expect(predictNextEmotionalState(makeState())).toBe("uncertain");
  });
});

// ── buildContinuityMessage ──

describe("buildContinuityMessage", () => {
  it("returns 'first visit' welcome for sessionCount=0", () => {
    const msg = buildContinuityMessage(makeState());
    expect(msg.title).toContain("أهلاً");
    expect(msg.ctaRoute).toBe("/program/day/1");
  });

  it("anchors to lastAnswer if present", () => {
    const msg = buildContinuityMessage(
      makeState({
        sessionCount: 2,
        lastAnswer: "أشعر بوضوح اليوم",
        lastPageVisited: "/reflection",
      })
    );
    expect(msg.body).toContain("أشعر بوضوح");
    expect(msg.ctaRoute).toBe("/reflection");
  });

  it("anchors to lastQuestion if no answer", () => {
    const msg = buildContinuityMessage(
      makeState({
        sessionCount: 1,
        lastQuestion: "ما الذي تتجنبه؟",
      })
    );
    expect(msg.body).toContain("ما الذي تتجنبه");
    expect(msg.ctaRoute).toBe("/reflection");
  });

  it("points to current day when just completedSteps", () => {
    const msg = buildContinuityMessage(
      makeState({
        sessionCount: 3,
        completedSteps: ["day_1", "day_2"],
        currentDay: 3,
      })
    );
    expect(msg.ctaRoute).toBe("/program/day/3");
    expect(msg.cta).toContain("3");
  });

  it("truncates long answers in preview", () => {
    const longAnswer = "ا".repeat(100);
    const msg = buildContinuityMessage(
      makeState({ sessionCount: 2, lastAnswer: longAnswer })
    );
    expect(msg.body).toContain("…");
  });
});

// ── classifySession ──

describe("classifySession", () => {
  it("returns 'first_visit' for sessionCount=0", () => {
    expect(classifySession(makeState())).toBe("first_visit");
  });

  it("returns 'returning_same_day' for recent activity", () => {
    const recent = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
    expect(classifySession(makeState({ sessionCount: 1, updatedAt: recent }))).toBe(
      "returning_same_day"
    );
  });

  it("returns 'returning_next_day' for ~24h gap", () => {
    const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    expect(classifySession(makeState({ sessionCount: 1, updatedAt: yesterday }))).toBe(
      "returning_next_day"
    );
  });

  it("returns 'returning_after_break' for long gaps", () => {
    const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString();
    expect(classifySession(makeState({ sessionCount: 1, updatedAt: oldDate }))).toBe(
      "returning_after_break"
    );
  });
});

// ── mergeStates ──

describe("mergeStates", () => {
  it("returns client state when server is null", () => {
    const client = makeState({ currentDay: 5 });
    expect(mergeStates(null, client)).toEqual(client);
  });

  it("prefers server state when server is newer", () => {
    const now = new Date().toISOString();
    const older = new Date(Date.now() - 1000 * 60).toISOString();
    const client = makeState({ currentDay: 2, updatedAt: older });
    const server = { ...makeState({ currentDay: 5 }), updatedAt: now };
    expect(mergeStates(server, client).currentDay).toBe(5);
  });

  it("prefers client state when client is newer", () => {
    const older = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const newer = new Date().toISOString();
    const client = makeState({ currentDay: 10, updatedAt: newer });
    const server = { ...makeState({ currentDay: 2 }), updatedAt: older };
    expect(mergeStates(server, client).currentDay).toBe(10);
  });
});
