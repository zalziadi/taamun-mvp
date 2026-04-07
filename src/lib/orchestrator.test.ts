import { describe, it, expect } from "vitest";
import {
  buildOrchestrator,
  shouldTriggerDecision,
  shouldShowProgress,
  shouldShowCity,
  boostZonesAfterDecision,
  type OrchestratorInputs,
} from "./orchestrator";
import type { ProgressState } from "./progressEngine";
import type { JourneyState } from "./journeyState";
import type { UserIdentity } from "./identityTracker";
import type { CityMap } from "./cityEngine";
import type { Pattern } from "./reflectionLinker";

const makeProgress = (o: Partial<ProgressState> = {}): ProgressState => ({
  currentDay: 5, storedDay: 5, calendarDay: 5, drift: 0, mode: "normal",
  completedDays: [1, 2, 3, 4, 5], missedDays: [], streak: 5, completionRate: 1,
  momentum: 4, emotionalDrift: "low", ...o,
});

const makeJourney = (o: Partial<JourneyState> = {}): JourneyState => ({
  currentMode: "flow", emotionalState: "engaged", cognitiveLoad: "low",
  lastShift: null, riskLevel: "low", trajectory: "improving", momentum: 4, ...o,
});

const makeIdentity = (o: Partial<UserIdentity> = {}): UserIdentity => ({
  completionPattern: "consistent", avgDriftFrequency: 0, reflectionDepth: "moderate",
  preferredTime: null, recurringThemes: [], dominantEmotion: null,
  awarenessProgression: "growing", totalReflections: 5, avgReflectionLength: 100,
  daysWithReflection: 5, guideSessions: 2, engagementScore: 60,
  transformationSignal: "emerging", trajectory: "improving", identityTimeline: [], ...o,
});

const makeRitual = () => ({
  entry: { message: "ابدأ", breathCue: true },
  intention: { focusArea: "العمق", intentionText: "نيتي" },
  action: { type: "reflect" as const, instruction: "اقرأ" },
  closing: { message: "انتهيت", integration: "احمل" },
});

const makeInputs = (o: Partial<OrchestratorInputs> = {}): OrchestratorInputs => ({
  progress: makeProgress(),
  journey: makeJourney(),
  context: null,
  guidance: null,
  identity: makeIdentity(),
  ritual: makeRitual(),
  city: null,
  patterns: [],
  reflectionCount: 5,
  ritualSeenToday: false,
  recentDecisions: [],
  ...o,
});

describe("shouldTriggerDecision", () => {
  it("triggers when user requests help", () => {
    const result = shouldTriggerDecision(makeInputs({ userRequestedHelp: true }));
    expect(result.trigger).toBe(true);
  });

  it("triggers when patterns include indecision", () => {
    const patterns: Pattern[] = [
      { keyword: "تردد", weight: 5, firstSeenDay: 1, recurrence: 3, type: "behavioral" },
    ];
    const result = shouldTriggerDecision(makeInputs({ patterns }));
    expect(result.trigger).toBe(true);
    expect(result.reason).toContain("تردد");
  });

  it("triggers on stuck decision history", () => {
    const result = shouldTriggerDecision(makeInputs({
      recentDecisions: [
        { decision: "a", goal: "أطلق المنتج", date: "2026-04-01" },
        { decision: "b", goal: "أطلق المنتج", date: "2026-04-02" },
        { decision: "c", goal: "أطلق المنتج", date: "2026-04-03" },
      ],
    }));
    expect(result.trigger).toBe(true);
  });

  it("does NOT trigger by default", () => {
    const result = shouldTriggerDecision(makeInputs());
    expect(result.trigger).toBe(false);
  });
});

describe("shouldShowProgress", () => {
  it("shows when drift > 2", () => {
    expect(shouldShowProgress(makeInputs({ progress: makeProgress({ drift: 4 }) }))).toBe(true);
  });

  it("hides when drift is 0 and no missed days", () => {
    expect(shouldShowProgress(makeInputs())).toBe(false);
  });
});

describe("shouldShowCity", () => {
  it("shows when reflectionCount >= 3", () => {
    expect(shouldShowCity(makeInputs({ reflectionCount: 5 }))).toBe(true);
  });

  it("shows when transformationSignal is emerging+", () => {
    expect(shouldShowCity(makeInputs({
      reflectionCount: 0,
      identity: makeIdentity({ transformationSignal: "deepening" }),
    }))).toBe(true);
  });

  it("hides for new users with no signal", () => {
    expect(shouldShowCity(makeInputs({
      reflectionCount: 0,
      identity: makeIdentity({ transformationSignal: "early" }),
    }))).toBe(false);
  });
});

describe("buildOrchestrator", () => {
  it("returns ritual as primary on first visit of day", () => {
    const result = buildOrchestrator(makeInputs({ ritualSeenToday: false }));
    expect(result.currentStep.type).toBe("ritual");
  });

  it("returns today as primary when ritual already seen", () => {
    const result = buildOrchestrator(makeInputs({ ritualSeenToday: true }));
    expect(result.currentStep.type).toBe("today");
  });

  it("returns decision as primary when triggered", () => {
    const result = buildOrchestrator(makeInputs({
      ritualSeenToday: true,
      userRequestedHelp: true,
    }));
    expect(result.currentStep.type).toBe("decision");
  });

  it("returns progress as primary on high drift", () => {
    const result = buildOrchestrator(makeInputs({
      ritualSeenToday: true,
      progress: makeProgress({ drift: 5, missedDays: [3, 4, 5] }),
    }));
    expect(result.currentStep.type).toBe("progress");
  });

  it("includes all 5 step types", () => {
    const result = buildOrchestrator(makeInputs());
    const types = result.steps.map((s) => s.type);
    expect(types).toContain("ritual");
    expect(types).toContain("today");
    expect(types).toContain("progress");
    expect(types).toContain("city");
    expect(types).toContain("decision");
  });

  it("only one step has highest priority among visible", () => {
    const result = buildOrchestrator(makeInputs());
    const visible = result.steps.filter((s) => s.visible);
    const maxPriority = Math.max(...visible.map((s) => s.priority));
    expect(result.currentStep.priority).toBe(maxPriority);
  });

  it("decision step requires input by default when triggered", () => {
    const result = buildOrchestrator(makeInputs({
      userRequestedHelp: true,
      ritualSeenToday: true,
    }));
    expect(result.currentStep.type).toBe("decision");
    expect(result.currentStep.data.requiresInput).toBe(true);
  });

  it("decision step contains decision result when input provided", () => {
    const result = buildOrchestrator(makeInputs({
      userRequestedHelp: true,
      ritualSeenToday: true,
      inlineDecisionInput: {
        currentState: { financial: "محدود" },
        goal: { shortTerm: "أبدأ مشروع" },
        constraints: { time: "ساعة يومياً" },
      },
    }));
    expect(result.currentStep.data.decision).not.toBeNull();
    expect(result.currentStep.data.decision.decision).toBeTruthy();
  });
});

describe("boostZonesAfterDecision", () => {
  it("boosts power and action zones", () => {
    const city: CityMap = {
      zones: [
        { id: "power", name: "power", state: "growing", signal: "test", energy: 30 },
        { id: "action", name: "action", state: "growing", signal: "test", energy: 40 },
        { id: "identity", name: "identity", state: "stable", signal: "test", energy: 60 },
      ],
      dominantZone: null,
      weakestZone: null,
    };
    const boosted = boostZonesAfterDecision(city);
    const power = boosted!.zones.find((z) => z.id === "power")!;
    const action = boosted!.zones.find((z) => z.id === "action")!;
    const identity = boosted!.zones.find((z) => z.id === "identity")!;
    expect(power.energy).toBe(45);
    expect(action.energy).toBe(55);
    expect(identity.energy).toBe(60); // unchanged
  });

  it("returns null for null input", () => {
    expect(boostZonesAfterDecision(null)).toBeNull();
  });

  it("upgrades state when energy crosses threshold", () => {
    const city: CityMap = {
      zones: [
        { id: "power", name: "power", state: "growing", signal: "test", energy: 40 },
      ],
      dominantZone: null,
      weakestZone: null,
    };
    const boosted = boostZonesAfterDecision(city);
    expect(boosted!.zones[0].state).toBe("stable"); // 40+15=55, crosses 50 threshold
  });
});
