import { describe, it, expect } from "vitest";
import { getNextBestAction, getNextStepOptions, type NextStepContext } from "./nextStep";

const baseCtx = (o: Partial<NextStepContext> = {}): NextStepContext => ({
  currentDay: 5,
  totalDays: 28,
  ...o,
});

describe("getNextBestAction — flow lock priority", () => {
  it("returns decision when flowLockEnabled is true", () => {
    const action = getNextBestAction(baseCtx({ flowLockEnabled: true }));
    expect(action.type).toBe("decision");
    expect(action.route).toBe("/decision");
    expect(action.priority).toBe(200);
    expect(action.emphasis).toBe("high");
  });

  it("returns decision when decisionTriggered is true", () => {
    const action = getNextBestAction(baseCtx({ decisionTriggered: true }));
    expect(action.type).toBe("decision");
  });

  it("decision overrides everything else", () => {
    const action = getNextBestAction(baseCtx({
      flowLockEnabled: true,
      hasUnfinishedDay: true,
      hasCompletedToday: true,
    }));
    expect(action.type).toBe("decision");
  });
});

describe("getNextBestAction — unfinished day", () => {
  it("returns continue_day when day unfinished", () => {
    const action = getNextBestAction(baseCtx({ hasUnfinishedDay: true }));
    expect(action.type).toBe("continue_day");
    expect(action.route).toBe("/program/day/5");
  });

  it("does NOT suggest continue when user is already on day page", () => {
    const action = getNextBestAction(baseCtx({
      hasUnfinishedDay: true,
      fromPage: "day",
    }));
    expect(action.type).not.toBe("continue_day");
  });
});

describe("getNextBestAction — next day after completion", () => {
  it("returns next_day when day is completed", () => {
    const action = getNextBestAction(baseCtx({
      hasCompletedToday: true,
      currentDay: 5,
    }));
    expect(action.type).toBe("next_day");
    expect(action.route).toBe("/program/day/6");
  });

  it("clamps next day at totalDays", () => {
    const action = getNextBestAction(baseCtx({
      hasCompletedToday: true,
      currentDay: 28,
    }));
    expect(action.route).toBe("/program/day/28");
  });
});

describe("getNextBestAction — page-aware suggestions", () => {
  it("from reflection → suggests next day", () => {
    const action = getNextBestAction(baseCtx({ fromPage: "reflection" }));
    expect(action.type).toBe("next_day");
  });

  it("from journey → suggests city", () => {
    const action = getNextBestAction(baseCtx({ fromPage: "journey" }));
    expect(action.type).toBe("city");
    expect(action.route).toBe("/city");
  });

  it("from city → suggests journey", () => {
    const action = getNextBestAction(baseCtx({ fromPage: "city" }));
    expect(action.type).toBe("journey");
    expect(action.route).toBe("/journey");
  });
});

describe("getNextBestAction — fallback", () => {
  it("returns continue_day as default", () => {
    const action = getNextBestAction(baseCtx());
    expect(action.type).toBe("continue_day");
    expect(action.route).toBe("/program/day/5");
  });
});

describe("getNextStepOptions", () => {
  it("returns ONLY decision when flowLock active", () => {
    const options = getNextStepOptions(baseCtx({ flowLockEnabled: true }));
    expect(options).toHaveLength(1);
    expect(options[0].type).toBe("decision");
  });

  it("returns 3 options for normal flow from reflection", () => {
    const options = getNextStepOptions(baseCtx({ fromPage: "reflection" }));
    expect(options.length).toBeGreaterThanOrEqual(2);
    expect(options.length).toBeLessThanOrEqual(3);
  });

  it("filters out current page from alternatives", () => {
    const fromCity = getNextStepOptions(baseCtx({ fromPage: "city" }));
    expect(fromCity.find((o) => o.type === "city")).toBeUndefined();

    const fromJourney = getNextStepOptions(baseCtx({ fromPage: "journey" }));
    expect(fromJourney.find((o) => o.type === "journey")).toBeUndefined();
  });

  it("first action has high emphasis", () => {
    const options = getNextStepOptions(baseCtx({ fromPage: "reflection" }));
    expect(options[0].emphasis).toBe("high");
  });
});
