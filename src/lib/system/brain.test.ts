import { describe, it, expect } from "vitest";
import {
  resolveSystemState,
  detectUserState,
  pickPrimaryAction,
  pickSecondaryActions,
  generateMessage,
  makeContext,
  type SystemContext,
  type BrainZone,
} from "./brain";

const defaultProgress = (o: Partial<SystemContext["progress"]> = {}): SystemContext["progress"] => ({
  hasStarted: true,
  currentDay: 5,
  streak: 2,
  momentum: 2,
  drift: 0,
  completedCount: 2,
  ...o,
});

const makeZone = (id: string, energy: number): BrainZone => ({
  id,
  name: id,
  energy,
  state: energy >= 75 ? "thriving" : energy >= 50 ? "stable" : energy >= 25 ? "growing" : "weak",
});

// ── detectUserState ──

describe("detectUserState", () => {
  it("returns 'search' when searchQuery present", () => {
    const ctx = makeContext({ progress: defaultProgress(), searchQuery: "قرار" });
    expect(detectUserState(ctx)).toBe("search");
  });

  it("returns 'new' for user who hasn't started", () => {
    const ctx = makeContext({ progress: defaultProgress({ hasStarted: false }) });
    expect(detectUserState(ctx)).toBe("new");
  });

  it("returns 'lost' when drift > 3", () => {
    const ctx = makeContext({ progress: defaultProgress({ drift: 5 }) });
    expect(detectUserState(ctx)).toBe("lost");
  });

  it("returns 'lost' when emotionalState is lost", () => {
    const ctx = makeContext({ progress: defaultProgress(), emotionalState: "lost" });
    expect(detectUserState(ctx)).toBe("lost");
  });

  it("returns 'imbalanced' with big zone energy gap", () => {
    const ctx = makeContext({
      progress: defaultProgress(),
      city: {
        dominantZone: "discipline",
        weakestZone: "relationships",
        zones: [
          makeZone("discipline", 85),
          makeZone("relationships", 15),
          makeZone("identity", 50),
        ],
      },
    });
    expect(detectUserState(ctx)).toBe("imbalanced");
  });

  it("does NOT return 'imbalanced' when gap is small", () => {
    const ctx = makeContext({
      progress: defaultProgress(),
      city: {
        dominantZone: "discipline",
        weakestZone: "relationships",
        zones: [
          makeZone("discipline", 55),
          makeZone("relationships", 35),
        ],
      },
    });
    expect(detectUserState(ctx)).not.toBe("imbalanced");
  });

  it("returns 'active' for momentum + streak", () => {
    const ctx = makeContext({ progress: defaultProgress({ momentum: 7, streak: 5 }) });
    expect(detectUserState(ctx)).toBe("active");
  });

  it("returns 'balanced' as default", () => {
    const ctx = makeContext({ progress: defaultProgress() });
    expect(detectUserState(ctx)).toBe("balanced");
  });

  it("prioritizes search over all other states", () => {
    const ctx = makeContext({
      progress: defaultProgress({ drift: 10, hasStarted: false }),
      searchQuery: "مدينة",
      emotionalState: "lost",
    });
    expect(detectUserState(ctx)).toBe("search");
  });
});

// ── pickPrimaryAction ──

describe("pickPrimaryAction", () => {
  it("new user → day 1", () => {
    const ctx = makeContext({ progress: defaultProgress({ hasStarted: false }) });
    const action = pickPrimaryAction("new", ctx);
    expect(action.type).toBe("day");
    expect(action.target).toBe("/program/day/1");
  });

  it("lost user → decision tool", () => {
    const ctx = makeContext({ progress: defaultProgress({ drift: 5 }) });
    const action = pickPrimaryAction("lost", ctx);
    expect(action.type).toBe("tool");
    expect(action.target).toBe("/decision");
  });

  it("lost + avoidant → breathing (softer)", () => {
    const ctx = makeContext({
      progress: defaultProgress({ drift: 5 }),
      userPattern: "avoidant",
    });
    const action = pickPrimaryAction("lost", ctx);
    expect(action.target).toBe("/breathing");
  });

  it("imbalanced → city with zone focus", () => {
    const ctx = makeContext({
      progress: defaultProgress(),
      city: {
        dominantZone: "discipline",
        weakestZone: "beauty",
        zones: [],
      },
    });
    const action = pickPrimaryAction("imbalanced", ctx);
    expect(action.type).toBe("zone");
    expect(action.target).toContain("beauty");
  });

  it("active → next day", () => {
    const ctx = makeContext({ progress: defaultProgress({ currentDay: 10, momentum: 8, streak: 6 }) });
    const action = pickPrimaryAction("active", ctx);
    expect(action.type).toBe("day");
    expect(action.target).toBe("/program/day/11");
  });

  it("balanced → current day", () => {
    const ctx = makeContext({ progress: defaultProgress({ currentDay: 7 }) });
    const action = pickPrimaryAction("balanced", ctx);
    expect(action.target).toBe("/program/day/7");
  });

  it("clamps next day at TOTAL_DAYS", () => {
    const ctx = makeContext({ progress: defaultProgress({ currentDay: 28 }) });
    const action = pickPrimaryAction("active", ctx);
    expect(action.target).toBe("/program/day/28");
  });
});

// ── pickSecondaryActions ──

describe("pickSecondaryActions", () => {
  it("avoidant gets NO secondary actions", () => {
    const ctx = makeContext({ progress: defaultProgress(), userPattern: "avoidant" });
    expect(pickSecondaryActions("lost", ctx)).toEqual([]);
  });

  it("decisive gets up to 2 secondary actions", () => {
    const ctx = makeContext({ progress: defaultProgress(), userPattern: "decisive" });
    const actions = pickSecondaryActions("lost", ctx);
    expect(actions.length).toBeLessThanOrEqual(2);
    expect(actions.length).toBeGreaterThan(0);
  });

  it("balanced gets 1 secondary action", () => {
    const ctx = makeContext({ progress: defaultProgress(), userPattern: "balanced" });
    const actions = pickSecondaryActions("active", ctx);
    expect(actions.length).toBe(1);
  });
});

// ── generateMessage ──

describe("generateMessage", () => {
  it("returns pattern-specific message for avoidant lost", () => {
    const ctx = makeContext({ progress: defaultProgress({ drift: 5 }), userPattern: "avoidant" });
    const msg = generateMessage("lost", ctx);
    expect(msg).toContain("هدوء");
  });

  it("returns pattern-specific message for decisive new", () => {
    const ctx = makeContext({ progress: defaultProgress({ hasStarted: false }), userPattern: "decisive" });
    const msg = generateMessage("new", ctx);
    expect(msg).toContain("ابدأ");
  });

  it("returns explorer-specific message for explorer", () => {
    const ctx = makeContext({ progress: defaultProgress(), userPattern: "explorer" });
    const msg = generateMessage("imbalanced", ctx);
    expect(msg).toContain("تُرى");
  });

  it("falls back to balanced for unknown pattern", () => {
    const ctx = makeContext({ progress: defaultProgress() });
    const msg = generateMessage("balanced", ctx);
    expect(msg).toBeTruthy();
    expect(msg.length).toBeGreaterThan(0);
  });
});

// ── resolveSystemState (integration) ──

describe("resolveSystemState — full integration", () => {
  it("new user returns complete decision", () => {
    const ctx = makeContext({ progress: defaultProgress({ hasStarted: false }) });
    const decision = resolveSystemState(ctx);
    expect(decision.caseName).toBe("new");
    expect(decision.primaryAction.target).toBe("/program/day/1");
    expect(decision.message).toBeTruthy();
    expect(decision.reason).toBeTruthy();
  });

  it("lost user sets lockFlow hint", () => {
    const ctx = makeContext({ progress: defaultProgress({ drift: 5 }) });
    const decision = resolveSystemState(ctx);
    expect(decision.caseName).toBe("lost");
    expect(decision.uiHints.lockFlow).toBe(true);
  });

  it("imbalanced sets highlightZone hint", () => {
    const ctx = makeContext({
      progress: defaultProgress(),
      city: {
        dominantZone: "discipline",
        weakestZone: "family",
        zones: [
          makeZone("discipline", 85),
          makeZone("family", 15),
        ],
      },
    });
    const decision = resolveSystemState(ctx);
    expect(decision.caseName).toBe("imbalanced");
    expect(decision.uiHints.highlightZone).toBe("family");
    expect(decision.uiHints.showToast).toBeTruthy();
  });

  it("active flow user shows dominant zone", () => {
    const ctx = makeContext({
      progress: defaultProgress({ momentum: 8, streak: 7 }),
      city: {
        dominantZone: "reflection",
        weakestZone: "power",
        zones: [makeZone("reflection", 80), makeZone("power", 60)],
      },
    });
    const decision = resolveSystemState(ctx);
    expect(decision.caseName).toBe("active");
    expect(decision.uiHints.highlightZone).toBe("reflection");
  });

  it("every decision has a primary action", () => {
    const states = ["new", "lost", "imbalanced", "active", "balanced", "search"] as const;
    for (const s of states) {
      const ctx = makeContext({
        progress: defaultProgress({ hasStarted: s !== "new", drift: s === "lost" ? 5 : 0 }),
        searchQuery: s === "search" ? "x" : undefined,
      });
      const decision = resolveSystemState(ctx);
      expect(decision.primaryAction).toBeDefined();
      expect(decision.primaryAction.target).toBeTruthy();
      expect(decision.primaryAction.label).toBeTruthy();
    }
  });
});
