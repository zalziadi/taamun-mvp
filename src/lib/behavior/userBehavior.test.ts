import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_BEHAVIOR,
  recordDecisionClick,
  recordReflectionSaved,
  recordCtaSeen,
  recordCtaDismissed,
  recordActionSpeed,
  recordBackNavigation,
  getCtaDismissalRate,
  getRecentInteractionCount,
} from "./userBehavior";

describe("recordDecisionClick", () => {
  it("increments decisionClicks", () => {
    const next = recordDecisionClick({ ...DEFAULT_BEHAVIOR });
    expect(next.decisionClicks).toBe(1);
    expect(next.lastInteractions[0]).toBe("decision_click");
  });
});

describe("recordReflectionSaved", () => {
  it("increments reflectionEngagement", () => {
    const next = recordReflectionSaved({ ...DEFAULT_BEHAVIOR });
    expect(next.reflectionEngagement).toBe(1);
  });
});

describe("recordActionSpeed", () => {
  it("computes rolling average", () => {
    let b = { ...DEFAULT_BEHAVIOR };
    b = recordActionSpeed(b, 30);
    b = recordActionSpeed(b, 60);
    b = recordActionSpeed(b, 90);
    expect(b.actionSpeedAvg).toBe(60);
    expect(b.speedSamples).toHaveLength(3);
  });

  it("clamps to 0-3600s", () => {
    const b = recordActionSpeed({ ...DEFAULT_BEHAVIOR }, 99999);
    expect(b.speedSamples[0]).toBe(3600);
  });
});

describe("getCtaDismissalRate", () => {
  it("returns 0 when no CTAs seen", () => {
    expect(getCtaDismissalRate({ ...DEFAULT_BEHAVIOR })).toBe(0);
  });

  it("computes ratio correctly", () => {
    let b = { ...DEFAULT_BEHAVIOR };
    b = recordCtaSeen(b);
    b = recordCtaSeen(b);
    b = recordCtaDismissed(b);
    expect(getCtaDismissalRate(b)).toBe(0.5);
  });
});

describe("getRecentInteractionCount", () => {
  it("counts tagged interactions", () => {
    let b = { ...DEFAULT_BEHAVIOR };
    b = recordDecisionClick(b);
    b = recordDecisionClick(b);
    b = recordReflectionSaved(b);
    expect(getRecentInteractionCount(b, "decision_click")).toBe(2);
    expect(getRecentInteractionCount(b, "reflection_saved")).toBe(1);
  });
});

describe("recordBackNavigation", () => {
  it("increments backNavigationCount", () => {
    let b = { ...DEFAULT_BEHAVIOR };
    b = recordBackNavigation(b);
    b = recordBackNavigation(b);
    expect(b.backNavigationCount).toBe(2);
  });
});
