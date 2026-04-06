import { describe, it, expect } from "vitest";
import {
  buildPersonalityProfile,
  generateMicroReward,
  adaptMessage,
  deriveStyle,
  deriveCommunication,
  deriveMotivation,
  deriveSensitivity,
} from "./personalityEngine";
import type { ProgressState } from "./progressEngine";
import type { UserIdentity, IdentitySnapshot } from "./identityTracker";
import type { Pattern } from "./reflectionLinker";
import type { PersonalityInputs } from "./personalityEngine";

const makeProgress = (o: Partial<ProgressState> = {}): ProgressState => ({
  currentDay: 10, storedDay: 10, calendarDay: 10, drift: 0, mode: "normal",
  completedDays: [1,2,3,4,5,6,7,8,9,10], missedDays: [], streak: 10, completionRate: 1,
  momentum: 6, emotionalDrift: "low", ...o,
});

const makeIdentity = (o: Partial<UserIdentity> = {}): UserIdentity => ({
  completionPattern: "consistent", avgDriftFrequency: 0, reflectionDepth: "moderate",
  preferredTime: null, recurringThemes: [], dominantEmotion: null,
  awarenessProgression: "growing", totalReflections: 8, avgReflectionLength: 150,
  daysWithReflection: 8, guideSessions: 3, engagementScore: 70,
  transformationSignal: "emerging", trajectory: "improving", identityTimeline: [], ...o,
});

const makeInputs = (o: Partial<PersonalityInputs> = {}): PersonalityInputs => ({
  identity: makeIdentity(), progress: makeProgress(), patterns: [],
  recentFeedbackImpacts: [], ...o,
});

describe("deriveStyle", () => {
  it("returns spiritual for deep + cognitive patterns", () => {
    const patterns: Pattern[] = [
      { keyword: "معنى", weight: 5, firstSeenDay: 1, recurrence: 4, type: "cognitive" },
      { keyword: "وعي", weight: 4, firstSeenDay: 2, recurrence: 3, type: "cognitive" },
    ];
    expect(deriveStyle(makeInputs({
      identity: makeIdentity({ reflectionDepth: "deep" }),
      patterns,
    }))).toBe("spiritual");
  });

  it("returns challenger for high momentum + consistent", () => {
    expect(deriveStyle(makeInputs({
      progress: makeProgress({ momentum: 7 }),
      identity: makeIdentity({ completionPattern: "consistent" }),
    }))).toBe("challenger");
  });

  it("returns supportive as default", () => {
    expect(deriveStyle(makeInputs({
      identity: makeIdentity({ reflectionDepth: "surface", completionPattern: "absent" }),
      progress: makeProgress({ momentum: 0 }),
    }))).toBe("supportive");
  });
});

describe("deriveCommunication", () => {
  it("returns provocative for declining + high drift", () => {
    expect(deriveCommunication(makeInputs({
      identity: makeIdentity({ trajectory: "declining" }),
      progress: makeProgress({ drift: 5 }),
    }))).toBe("provocative");
  });

  it("returns direct for high engagement + momentum", () => {
    expect(deriveCommunication(makeInputs({
      identity: makeIdentity({ engagementScore: 75 }),
      progress: makeProgress({ momentum: 5 }),
    }))).toBe("direct");
  });

  it("returns reflective for deep reflections", () => {
    expect(deriveCommunication(makeInputs({
      identity: makeIdentity({ reflectionDepth: "deep", engagementScore: 40 }),
      progress: makeProgress({ momentum: 1 }),
    }))).toBe("reflective");
  });
});

describe("deriveMotivation", () => {
  it("returns fear-driven for recurring fear patterns", () => {
    const patterns: Pattern[] = [
      { keyword: "خوف", weight: 5, firstSeenDay: 1, recurrence: 3, type: "emotional" },
    ];
    expect(deriveMotivation(makeInputs({ patterns }))).toBe("fear-driven");
  });

  it("returns purpose-driven for meaning patterns", () => {
    const patterns: Pattern[] = [
      { keyword: "معنى", weight: 4, firstSeenDay: 1, recurrence: 2, type: "cognitive" },
    ];
    expect(deriveMotivation(makeInputs({ patterns }))).toBe("purpose-driven");
  });

  it("returns growth-driven as default", () => {
    expect(deriveMotivation(makeInputs())).toBe("growth-driven");
  });
});

describe("generateMicroReward", () => {
  it("returns streak reward at 7 days", () => {
    const r = generateMicroReward(makeProgress({ streak: 7 }), makeIdentity());
    expect(r).not.toBeNull();
    expect(r!.type).toBe("streak");
    expect(r!.intensity).toBe("medium");
  });

  it("returns breakthrough reward for integrated signal", () => {
    const r = generateMicroReward(makeProgress(), makeIdentity({ transformationSignal: "integrated" }));
    expect(r).not.toBeNull();
    expect(r!.type).toBe("breakthrough");
    expect(r!.intensity).toBe("high");
  });

  it("returns return reward for recovery_boost", () => {
    const r = generateMicroReward(makeProgress({ mode: "recovery_boost" }), makeIdentity());
    expect(r).not.toBeNull();
    expect(r!.type).toBe("return");
  });

  it("returns null when no milestone", () => {
    const r = generateMicroReward(makeProgress({ streak: 2 }), makeIdentity({ transformationSignal: "emerging", totalReflections: 3 }));
    expect(r).toBeNull();
  });
});

describe("adaptMessage", () => {
  it("adds challenger suffix", () => {
    const msg = adaptMessage("تابع", {
      style: "challenger", communication: "direct",
      motivationType: "growth-driven", sensitivityLevel: "low", adaptationScore: 0.8,
    });
    expect(msg.length).toBeGreaterThan("تابع".length);
  });

  it("softens provocative for high sensitivity", () => {
    const msg = adaptMessage("وقفت ليش", {
      style: "supportive", communication: "provocative",
      motivationType: "fear-driven", sensitivityLevel: "high", adaptationScore: 0.6,
    });
    expect(msg).toContain("خذ وقتك");
  });
});

describe("buildPersonalityProfile", () => {
  it("returns complete profile", () => {
    const p = buildPersonalityProfile(makeInputs());
    expect(p.style).toBeDefined();
    expect(p.communication).toBeDefined();
    expect(p.motivationType).toBeDefined();
    expect(p.sensitivityLevel).toBeDefined();
    expect(p.adaptationScore).toBeGreaterThan(0);
  });
});
