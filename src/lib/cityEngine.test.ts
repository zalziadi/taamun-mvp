import { describe, it, expect } from "vitest";
import { buildCityMap, stateFromEnergy, patternEnergyForZone, getSignal, ZONE_META } from "./cityEngine";
import type { ProgressState } from "./progressEngine";
import type { UserIdentity } from "./identityTracker";
import type { JourneyState } from "./journeyState";
import type { CityInputs } from "./cityEngine";
import type { Pattern } from "./reflectionLinker";

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

const makeJourney = (o: Partial<JourneyState> = {}): JourneyState => ({
  currentMode: "flow", emotionalState: "engaged", cognitiveLoad: "low",
  lastShift: null, riskLevel: "low", trajectory: "improving", momentum: 5, ...o,
});

const makeInputs = (o: Partial<CityInputs> = {}): CityInputs => ({
  identity: makeIdentity(), progress: makeProgress(), context: null,
  journey: makeJourney(), patterns: [], actionsCompleted: 5, actionEffectiveness: 5, ...o,
});

describe("stateFromEnergy", () => {
  it("maps energy to states correctly", () => {
    expect(stateFromEnergy(10)).toBe("weak");
    expect(stateFromEnergy(30)).toBe("growing");
    expect(stateFromEnergy(55)).toBe("stable");
    expect(stateFromEnergy(80)).toBe("thriving");
  });
});

describe("patternEnergyForZone", () => {
  it("returns energy for matching patterns", () => {
    const patterns: Pattern[] = [
      { keyword: "وعي", weight: 5, firstSeenDay: 1, recurrence: 3, type: "cognitive" },
    ];
    expect(patternEnergyForZone("reflection", patterns)).toBeGreaterThan(0);
  });

  it("returns 0 for no matches", () => {
    const patterns: Pattern[] = [
      { keyword: "خوف", weight: 3, firstSeenDay: 1, recurrence: 2, type: "emotional" },
    ];
    expect(patternEnergyForZone("discipline", patterns)).toBe(0);
  });
});

describe("getSignal", () => {
  it("returns Arabic signal for zone + state", () => {
    const signal = getSignal("identity", "growing");
    expect(signal).toContain("تتشكّل");
  });

  it("returns fallback for unknown zone", () => {
    const signal = getSignal("unknown", "weak");
    expect(signal).toContain("تنتظر");
  });
});

describe("buildCityMap", () => {
  it("returns 9 zones", () => {
    const city = buildCityMap(makeInputs());
    expect(city.zones).toHaveLength(9);
  });

  it("all zones have required fields", () => {
    const city = buildCityMap(makeInputs());
    for (const zone of city.zones) {
      expect(zone.id).toBeTruthy();
      expect(zone.name).toBeTruthy();
      expect(["weak", "growing", "stable", "thriving"]).toContain(zone.state);
      expect(zone.signal).toBeTruthy();
      expect(zone.energy).toBeGreaterThanOrEqual(0);
      expect(zone.energy).toBeLessThanOrEqual(100);
    }
  });

  it("discipline zone is strong with high streak", () => {
    const city = buildCityMap(makeInputs({ progress: makeProgress({ streak: 14, completionRate: 1, momentum: 8 }) }));
    const discipline = city.zones.find((z) => z.id === "discipline")!;
    expect(discipline.energy).toBeGreaterThanOrEqual(50);
    expect(["stable", "thriving"]).toContain(discipline.state);
  });

  it("reflection zone is strong with deep reflections", () => {
    const city = buildCityMap(makeInputs({
      identity: makeIdentity({ reflectionDepth: "deep", totalReflections: 12 }),
      patterns: [{ keyword: "وعي", weight: 5, firstSeenDay: 1, recurrence: 4, type: "cognitive" }],
    }));
    const reflection = city.zones.find((z) => z.id === "reflection")!;
    expect(reflection.energy).toBeGreaterThanOrEqual(50);
  });

  it("identity zone tracks transformation signal", () => {
    const city = buildCityMap(makeInputs({
      identity: makeIdentity({ trajectory: "improving", transformationSignal: "integrated", engagementScore: 85 }),
    }));
    const identity = city.zones.find((z) => z.id === "identity")!;
    expect(identity.state).toBe("thriving");
  });

  it("identifies dominant and weakest zones", () => {
    const city = buildCityMap(makeInputs());
    // With default inputs, discipline should be strong (high streak)
    expect(city.dominantZone).toBeTruthy();
  });

  it("action zone grows with completed actions", () => {
    const cityLow = buildCityMap(makeInputs({ actionsCompleted: 0, actionEffectiveness: 0 }));
    const cityHigh = buildCityMap(makeInputs({ actionsCompleted: 10, actionEffectiveness: 8 }));
    const actionLow = cityLow.zones.find((z) => z.id === "action")!;
    const actionHigh = cityHigh.zones.find((z) => z.id === "action")!;
    expect(actionHigh.energy).toBeGreaterThan(actionLow.energy);
  });
});
