import { describe, it, expect } from "vitest";
import { generateGuidance, deriveTone, deriveFocus, deriveConfidence } from "./guidanceEngine";
import type { ProgressState } from "./progressEngine";
import type { JourneyState } from "./journeyState";
import type { GuidanceInputs } from "./guidanceEngine";

const makeProgress = (o: Partial<ProgressState> = {}): ProgressState => ({
  currentDay: 6, storedDay: 6, calendarDay: 6, drift: 0, mode: "normal",
  completedDays: [1, 2, 3, 4, 5, 6], missedDays: [], streak: 6, completionRate: 1,
  momentum: 5, emotionalDrift: "low", ...o,
});

const makeJourney = (o: Partial<JourneyState> = {}): JourneyState => ({
  currentMode: "flow", emotionalState: "engaged", cognitiveLoad: "low",
  lastShift: null, riskLevel: "low", trajectory: "improving", momentum: 5, ...o,
});

const makeInputs = (o: Partial<GuidanceInputs> = {}): GuidanceInputs => ({
  progress: makeProgress(),
  journey: makeJourney(),
  identity: null,
  context: null,
  narrative: null,
  ...o,
});

describe("deriveTone", () => {
  it("returns supportive for negative momentum", () => {
    expect(deriveTone(makeInputs({ progress: makeProgress({ momentum: -5 }) }))).toBe("supportive");
  });

  it("returns challenging for high momentum + engaged", () => {
    expect(deriveTone(makeInputs({
      progress: makeProgress({ momentum: 7 }),
      journey: makeJourney({ emotionalState: "engaged" }),
    }))).toBe("challenging");
  });

  it("returns supportive when user is lost", () => {
    expect(deriveTone(makeInputs({
      journey: makeJourney({ emotionalState: "lost" }),
    }))).toBe("supportive");
  });

  it("returns reflective as default", () => {
    expect(deriveTone(makeInputs({ progress: makeProgress({ momentum: 2 }) }))).toBe("reflective");
  });
});

describe("deriveFocus", () => {
  it("returns recover for high drift", () => {
    expect(deriveFocus(makeInputs({ progress: makeProgress({ drift: 5 }) }))).toBe("recover");
  });

  it("returns recover for recovery mode", () => {
    expect(deriveFocus(makeInputs({
      journey: makeJourney({ currentMode: "recovery" }),
    }))).toBe("recover");
  });

  it("returns decide for resistant user", () => {
    expect(deriveFocus(makeInputs({
      journey: makeJourney({ emotionalState: "resistant" }),
    }))).toBe("decide");
  });

  it("returns deepen for breakthrough", () => {
    expect(deriveFocus(makeInputs({
      journey: makeJourney({ currentMode: "breakthrough" }),
    }))).toBe("deepen");
  });

  it("returns continue as default", () => {
    expect(deriveFocus(makeInputs())).toBe("continue");
  });
});

describe("deriveConfidence", () => {
  it("increases with more completed days", () => {
    const low = deriveConfidence(makeInputs({ progress: makeProgress({ completedDays: [1] }) }));
    const high = deriveConfidence(makeInputs({ progress: makeProgress({ completedDays: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] }) }));
    expect(high).toBeGreaterThan(low);
  });

  it("decreases with high drift", () => {
    const normal = deriveConfidence(makeInputs());
    const drifted = deriveConfidence(makeInputs({ progress: makeProgress({ drift: 7 }) }));
    expect(drifted).toBeLessThan(normal);
  });
});

describe("generateGuidance", () => {
  it("returns complete guidance object", () => {
    const g = generateGuidance(makeInputs());
    expect(g.message).toBeTruthy();
    expect(g.tone).toBeDefined();
    expect(g.focus).toBeDefined();
    expect(g.suggestedPath.type).toBeDefined();
    expect(g.suggestedPath.reason).toBeTruthy();
    expect(g.confidence).toBeGreaterThan(0);
  });

  it("returns recovery guidance for high drift", () => {
    const g = generateGuidance(makeInputs({
      progress: makeProgress({ drift: 5, momentum: -3, missedDays: [3, 4, 5, 6] }),
      journey: makeJourney({ currentMode: "recovery", emotionalState: "lost" }),
    }));
    expect(g.focus).toBe("recover");
    expect(g.tone).toBe("supportive");
    expect(g.suggestedPath.type).toBe("review");
  });

  it("returns challenging continue for strong streak", () => {
    const g = generateGuidance(makeInputs({
      progress: makeProgress({ streak: 7, momentum: 8 }),
      journey: makeJourney({ emotionalState: "engaged" }),
    }));
    expect(g.tone).toBe("challenging");
    expect(g.focus).toBe("continue");
  });

  it("uses narrative in message when available", () => {
    const g = generateGuidance(makeInputs({
      narrative: { title: "رحلة البطل", story: "أنت في مرحلة عمق حقيقي — كل يوم يكشف طبقة جديدة", arc: "hero" },
    }));
    expect(g.message).toContain("عمق حقيقي");
  });
});
