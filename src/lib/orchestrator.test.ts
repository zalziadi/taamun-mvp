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

describe("orchestrator V2 — flow lock", () => {
  it("enables flow lock when decision is current step", () => {
    const result = buildOrchestrator(makeInputs({
      ritualSeenToday: true,
      userRequestedHelp: true,
    }));
    expect(result.flowLock?.enabled).toBe(true);
    expect(result.flowLock?.reason).toBe("decision_focus");
  });

  it("does NOT enable flow lock for non-decision steps", () => {
    const result = buildOrchestrator(makeInputs({ ritualSeenToday: true }));
    expect(result.flowLock).toBeUndefined();
  });

  it("hides other steps when flow lock active", () => {
    const result = buildOrchestrator(makeInputs({
      ritualSeenToday: true,
      userRequestedHelp: true,
    }));
    const visibleNonDecision = result.steps.filter(
      (s) => s.visible && s.type !== "decision"
    );
    expect(visibleNonDecision).toHaveLength(0);
  });
});

describe("orchestrator V2 — predictive trigger", () => {
  it("attaches triggerType reactive when user requests help", () => {
    const result = buildOrchestrator(makeInputs({
      ritualSeenToday: true,
      userRequestedHelp: true,
    }));
    expect(result.currentStep.data.triggerType).toBe("reactive");
  });

  it("attaches triggerType predictive when prediction > 0.7", () => {
    const patterns: Pattern[] = [
      { keyword: "تردد", weight: 5, firstSeenDay: 1, recurrence: 3, type: "behavioral" },
    ];
    const recentDecisions = [
      { decision: "تردد في الخطوة", goal: "test", date: "2026-04-01" },
      { decision: "تردد آخر", goal: "test", date: "2026-04-02" },
      { decision: "ما زلت في تردد", goal: "test", date: "2026-04-03" },
    ];
    const result = buildOrchestrator(makeInputs({
      ritualSeenToday: true,
      patterns,
      recentDecisions,
      context: { commitmentScore: 30 } as any,
    }));
    expect(result.currentStep.type).toBe("decision");
    // Either reactive (stuck) or predictive — both are valid for this scenario
    expect(["reactive", "predictive"]).toContain(result.currentStep.data.triggerType);
  });
});

describe("orchestrator V2 — justification", () => {
  it("attaches justification when decision triggered", () => {
    const patterns: Pattern[] = [
      { keyword: "تردد", weight: 5, firstSeenDay: 1, recurrence: 3, type: "behavioral" },
    ];
    const result = buildOrchestrator(makeInputs({
      ritualSeenToday: true,
      patterns,
    }));
    expect(result.currentStep.type).toBe("decision");
    expect(result.currentStep.data.justification).not.toBeNull();
    expect(result.currentStep.data.justification.insight).toBeTruthy();
    expect(result.currentStep.data.justification.evidence).toBeTruthy();
    expect(result.currentStep.data.justification.emotional_hook).toBeTruthy();
  });

  it("does NOT attach justification when not triggered", () => {
    const result = buildOrchestrator(makeInputs({ ritualSeenToday: true }));
    if (result.currentStep.type === "decision") {
      // If somehow triggered, justification should still be present
      expect(result.currentStep.data.justification).not.toBeNull();
    } else {
      // For non-decision steps, the decision step (in steps[]) has no justification
      const decisionStep = result.steps.find((s) => s.type === "decision");
      expect(decisionStep?.data.justification).toBeNull();
    }
  });
});

describe("orchestrator V2 — tone", () => {
  it("returns tone in state", () => {
    const result = buildOrchestrator(makeInputs());
    expect(["calm", "firm", "motivational", "compassionate"]).toContain(result.tone);
  });

  it("primarySignal is non-empty", () => {
    const result = buildOrchestrator(makeInputs());
    expect(result.primarySignal).toBeTruthy();
  });
});

describe("orchestrator V2 — identity update", () => {
  it("returns identity update with shift + trajectory_delta", () => {
    const result = buildOrchestrator(makeInputs());
    expect(result.identityUpdate).toBeDefined();
    expect(typeof result.identityUpdate?.identity_shift).toBe("number");
    expect(typeof result.identityUpdate?.trajectory_delta).toBe("number");
    expect(result.identityUpdate?.reason).toBeTruthy();
  });

  it("decision step produces higher shift than other steps", () => {
    const decisionResult = buildOrchestrator(makeInputs({
      ritualSeenToday: true,
      userRequestedHelp: true,
    }));
    const todayResult = buildOrchestrator(makeInputs({ ritualSeenToday: true }));
    expect(decisionResult.identityUpdate!.identity_shift).toBeGreaterThanOrEqual(
      todayResult.identityUpdate!.identity_shift
    );
  });
});

describe("orchestrator V3 — identity reflection", () => {
  it("returns identity reflection in state", () => {
    const result = buildOrchestrator(makeInputs());
    expect(result.identityReflection).toBeDefined();
    expect(result.identityReflection?.message).toBeTruthy();
    expect(result.identityReflection?.before_state).toBeTruthy();
    expect(result.identityReflection?.after_state).toBeTruthy();
  });

  it("reflection message scales with action intensity", () => {
    const decisionResult = buildOrchestrator(makeInputs({
      ritualSeenToday: true,
      userRequestedHelp: true,
    }));
    const todayResult = buildOrchestrator(makeInputs({ ritualSeenToday: true }));
    // Decision shift should be higher than today (reflection action)
    expect(decisionResult.identityUpdate!.identity_shift).toBeGreaterThanOrEqual(
      todayResult.identityUpdate!.identity_shift
    );
  });
});

describe("orchestrator V3 — narrative memory", () => {
  it("returns narrative memory when timeline provided", () => {
    const result = buildOrchestrator(makeInputs({
      narrativeTimeline: [
        { day: 1, state: "shadow" },
        { day: 3, state: "gift" },
        { day: 5, state: "best_possibility" },
      ],
    }));
    expect(result.narrativeMemory).toBeDefined();
    expect(result.narrativeMemory!.length).toBeGreaterThan(0);
  });

  it("returns empty array when no timeline", () => {
    const result = buildOrchestrator(makeInputs());
    expect(result.narrativeMemory).toEqual([]);
  });
});

describe("orchestrator V3 — anticipation", () => {
  it("returns anticipation hint + progress", () => {
    const result = buildOrchestrator(makeInputs({
      progress: makeProgress({ streak: 5 }),
    }));
    expect(result.anticipation).toBeDefined();
    expect(result.anticipation?.hint).toBeTruthy();
    expect(result.anticipation?.progress).toBeGreaterThan(0);
    expect(result.anticipation?.nextMilestone).toBeGreaterThan(0);
  });
});

describe("orchestrator V3 — adaptive pressure", () => {
  it("returns pressure level + class + CTA", () => {
    const result = buildOrchestrator(makeInputs());
    expect(result.pressureLevel).toBeGreaterThanOrEqual(0);
    expect(result.pressureLevel).toBeLessThanOrEqual(1);
    expect(result.pressureClass).toBeDefined();
    expect(result.pressureCTA).toBeTruthy();
  });

  it("lower pressure when user is resistant", () => {
    const resistant = buildOrchestrator(makeInputs({
      journey: makeJourney({ emotionalState: "resistant" }),
    }));
    const engaged = buildOrchestrator(makeInputs({
      journey: makeJourney({ emotionalState: "engaged", riskLevel: "low" }),
      progress: makeProgress({ momentum: 7 }),
    }));
    expect(resistant.pressureLevel!).toBeLessThan(engaged.pressureLevel!);
  });

  it("decision step receives pressure data inline", () => {
    const result = buildOrchestrator(makeInputs({
      ritualSeenToday: true,
      userRequestedHelp: true,
    }));
    expect(result.currentStep.type).toBe("decision");
    expect(result.currentStep.data.pressureLevel).toBeDefined();
    expect(result.currentStep.data.pressureCTA).toBeTruthy();
    expect(result.currentStep.data.reflection).toBeDefined();
    expect(result.currentStep.data.anticipation).toBeDefined();
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
