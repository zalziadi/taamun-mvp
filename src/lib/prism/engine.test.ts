import { describe, it, expect } from "vitest";
import {
  runPrism,
  selectMode,
  selectTone,
  selectDepth,
  selectEnergy,
  detectHesitation,
  isDecisionTriggered,
  FALLBACK,
  type PrismInput,
} from "./engine";
import type { ProgressState } from "../progressEngine";
import type { JourneyState } from "../journeyState";
import type { Pattern } from "../reflectionLinker";
import type { UserModel } from "../adaptive/model";
import { DEFAULT_USER_MODEL } from "../adaptive/model";

const makeProgress = (o: Partial<ProgressState> = {}): ProgressState => ({
  currentDay: 5, storedDay: 5, calendarDay: 5, drift: 0, mode: "normal",
  completedDays: [1, 2, 3, 4, 5], missedDays: [], streak: 5, completionRate: 1,
  momentum: 4, emotionalDrift: "low", ...o,
});

const makeJourney = (o: Partial<JourneyState> = {}): JourneyState => ({
  currentMode: "flow", emotionalState: "engaged", cognitiveLoad: "low",
  lastShift: null, riskLevel: "low", trajectory: "improving", momentum: 4, ...o,
});

const makeInput = (o: Partial<PrismInput> = {}): PrismInput => ({
  user: { id: "u1" },
  adaptiveModel: { ...DEFAULT_USER_MODEL },
  behaviorSignals: {},
  journeyState: makeJourney(),
  context: {
    progress: makeProgress(),
    cognitive: null,
    patterns: [],
    reflectionCount: 0,
  },
  ...o,
});

describe("detectHesitation", () => {
  it("detects hesitation in patterns", () => {
    const patterns: Pattern[] = [
      { keyword: "تردد", weight: 5, firstSeenDay: 1, recurrence: 3, type: "behavioral" },
    ];
    expect(detectHesitation(patterns)).toBe(true);
  });

  it("returns false for non-hesitation patterns", () => {
    const patterns: Pattern[] = [
      { keyword: "وضوح", weight: 5, firstSeenDay: 1, recurrence: 3, type: "cognitive" },
    ];
    expect(detectHesitation(patterns)).toBe(false);
  });
});

describe("selectMode", () => {
  it("returns 'decide' for hesitation + high resistance", () => {
    const input = makeInput({
      adaptiveModel: { ...DEFAULT_USER_MODEL, resistanceLevel: 0.8 },
      context: {
        progress: makeProgress(),
        cognitive: null,
        patterns: [{ keyword: "تردد", weight: 5, firstSeenDay: 1, recurrence: 3, type: "behavioral" }],
        reflectionCount: 0,
      },
    });
    expect(selectMode(input, input.adaptiveModel!, true)).toBe("decide");
  });

  it("returns 'reflect' for high commitment + reflections", () => {
    const input = makeInput({
      context: {
        progress: makeProgress(),
        cognitive: { commitmentScore: 80 } as any,
        patterns: [],
        reflectionCount: 6,
      },
    });
    expect(selectMode(input, input.adaptiveModel!, false)).toBe("reflect");
  });

  it("returns 'expand' for stable progress", () => {
    const input = makeInput({
      context: {
        progress: makeProgress({ streak: 7, momentum: 5 }),
        cognitive: null,
        patterns: [],
        reflectionCount: 0,
      },
    });
    expect(selectMode(input, input.adaptiveModel!, false)).toBe("expand");
  });

  it("returns 'explore' as default for new neutral user", () => {
    const input = makeInput({
      context: {
        progress: makeProgress({ streak: 1, momentum: 0 }),
        cognitive: null,
        patterns: [],
        reflectionCount: 0,
      },
    });
    expect(selectMode(input, input.adaptiveModel!, false)).toBe("explore");
  });
});

describe("selectTone", () => {
  it("returns 'firm' for decide mode (default sensitivity)", () => {
    expect(selectTone(makeInput(), "decide", DEFAULT_USER_MODEL)).toBe("firm");
  });

  it("returns 'calm' for decide mode + sensitive user", () => {
    const model = { ...DEFAULT_USER_MODEL, pressureSensitivity: 0.85 };
    expect(selectTone(makeInput(), "decide", model)).toBe("calm");
  });

  it("returns 'soft' for lost emotional state", () => {
    expect(selectTone(
      makeInput({ journeyState: makeJourney({ emotionalState: "lost" }) }),
      "explore",
      DEFAULT_USER_MODEL
    )).toBe("soft");
  });

  it("returns 'intense' for very high momentum", () => {
    expect(selectTone(
      makeInput({ context: { progress: makeProgress({ momentum: 8 }), cognitive: null, patterns: [], reflectionCount: 0 } }),
      "expand",
      DEFAULT_USER_MODEL
    )).toBe("intense");
  });
});

describe("selectDepth", () => {
  it("returns 'deep' when explicitly requested", () => {
    expect(selectDepth(
      makeInput({ behaviorSignals: { requestedDepth: true } }),
      DEFAULT_USER_MODEL
    )).toBe("deep");
  });

  it("returns 'deep' when reflectionDepthPreference > 0.7", () => {
    const model = { ...DEFAULT_USER_MODEL, reflectionDepthPreference: 0.9 };
    expect(selectDepth(makeInput(), model)).toBe("deep");
  });

  it("returns 'short' when preference low", () => {
    const model = { ...DEFAULT_USER_MODEL, reflectionDepthPreference: 0.1 };
    expect(selectDepth(makeInput(), model)).toBe("short");
  });

  it("returns 'medium' as default", () => {
    expect(selectDepth(makeInput(), DEFAULT_USER_MODEL)).toBe("medium");
  });
});

describe("selectEnergy", () => {
  it("returns 'high' for momentum + consistency", () => {
    const model = { ...DEFAULT_USER_MODEL, consistencyScore: 0.8 };
    expect(selectEnergy(
      makeInput({ context: { progress: makeProgress({ momentum: 7 }), cognitive: null, patterns: [], reflectionCount: 0 } }),
      model
    )).toBe("high");
  });

  it("returns 'low' for negative momentum", () => {
    expect(selectEnergy(
      makeInput({ context: { progress: makeProgress({ momentum: -5 }), cognitive: null, patterns: [], reflectionCount: 0 } }),
      DEFAULT_USER_MODEL
    )).toBe("low");
  });
});

describe("isDecisionTriggered", () => {
  it("triggers on user request", () => {
    const result = isDecisionTriggered(
      makeInput({ behaviorSignals: { userRequestedHelp: true } }),
      DEFAULT_USER_MODEL,
      false
    );
    expect(result.trigger).toBe(true);
  });

  it("triggers on high resistance", () => {
    const model = { ...DEFAULT_USER_MODEL, resistanceLevel: 0.85 };
    const result = isDecisionTriggered(makeInput(), model, false);
    expect(result.trigger).toBe(true);
  });

  it("triggers on low consistency + 3+ days", () => {
    const model = { ...DEFAULT_USER_MODEL, consistencyScore: 0.2 };
    const result = isDecisionTriggered(
      makeInput({ context: { progress: makeProgress({ completedDays: [1, 2, 3, 4] }), cognitive: null, patterns: [], reflectionCount: 0 } }),
      model,
      false
    );
    expect(result.trigger).toBe(true);
  });

  it("triggers on hesitation", () => {
    const result = isDecisionTriggered(makeInput(), DEFAULT_USER_MODEL, true);
    expect(result.trigger).toBe(true);
  });

  it("does NOT trigger by default", () => {
    const result = isDecisionTriggered(makeInput(), DEFAULT_USER_MODEL, false);
    expect(result.trigger).toBe(false);
  });
});

describe("runPrism", () => {
  it("returns full structured output", () => {
    const result = runPrism(makeInput());
    expect(result.experienceProfile).toBeDefined();
    expect(result.experienceProfile.mode).toBeDefined();
    expect(result.experienceProfile.tone).toBeDefined();
    expect(result.experienceProfile.pressureLevel).toBeGreaterThanOrEqual(0);
    expect(result.experienceProfile.pressureLevel).toBeLessThanOrEqual(1);
    expect(result.experienceProfile.depthMode).toBeDefined();
    expect(result.experienceProfile.energyState).toBeDefined();
    expect(result.primaryDirection).toBeDefined();
    expect(result.experienceSignals).toBeDefined();
    expect(result.orchestratorHint).toBeDefined();
  });

  it("locks flow when decision triggered", () => {
    const result = runPrism(makeInput({
      behaviorSignals: { userRequestedHelp: true },
    }));
    expect(result.orchestratorHint.lockFlow).toBe(true);
    expect(result.orchestratorHint.lockReason).toBe("decision_focus");
    expect(result.primaryDirection.type).toBe("decision");
  });

  it("does NOT lock flow when no decision triggered", () => {
    const result = runPrism(makeInput());
    expect(result.orchestratorHint.lockFlow).toBe(false);
  });

  it("identifies dominant pattern", () => {
    const result = runPrism(makeInput({
      context: {
        progress: makeProgress(),
        cognitive: null,
        patterns: [
          { keyword: "وعي", weight: 8, firstSeenDay: 1, recurrence: 5, type: "cognitive" },
          { keyword: "خوف", weight: 3, firstSeenDay: 2, recurrence: 2, type: "emotional" },
        ],
        reflectionCount: 2,
      },
    }));
    expect(result.experienceSignals.dominantPattern).toBe("وعي");
  });

  it("returns FALLBACK on internal error (smoke test)", () => {
    // Pass invalid input that would normally crash — but try/catch wraps it
    const result = runPrism({
      user: null,
      adaptiveModel: null,
      behaviorSignals: {},
      journeyState: null as any,
      context: null as any,
    });
    expect(result.experienceProfile.mode).toBe(FALLBACK.experienceProfile.mode);
  });

  it("decide mode → primary direction = decision", () => {
    const result = runPrism(makeInput({
      behaviorSignals: { userRequestedHelp: true },
    }));
    expect(result.primaryDirection.type).toBe("decision");
    expect(result.primaryDirection.priority).toBe(200);
  });

  it("identifies user state", () => {
    const result = runPrism(makeInput({
      journeyState: makeJourney({ emotionalState: "engaged" }),
    }));
    expect(result.experienceSignals.userState).toBe("engaged");
  });
});
