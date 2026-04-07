import { describe, it, expect } from "vitest";
import {
  runDecisionPipeline,
  checkDecisionHealth,
  clarify,
  prioritize,
  eliminate,
  select,
  buildIgnoreList,
  computeConfidence,
  type DecisionInput,
} from "./decisionEngine";

const baseInput: DecisionInput = {
  currentState: { financial: "محدود", emotional: "متحمّس", practical: "وحدي" },
  goal: { shortTerm: "أطلق منتجي الأول" },
  constraints: { money: "ميزانية صفر", time: "ساعة يومياً" },
};

describe("clarify", () => {
  it("summarizes all 3 dimensions", () => {
    const result = clarify(baseInput);
    expect(result).toContain("3");
    expect(result).toContain("محدود");
  });

  it("handles missing state", () => {
    const result = clarify({ currentState: {}, goal: { shortTerm: "test" }, constraints: {} });
    expect(result).toContain("غير محدد");
  });
});

describe("prioritize", () => {
  it("ranks money constraint highest", () => {
    const result = prioritize(baseInput);
    expect(result).toContain("القيد المالي");
  });

  it("falls back to goal when no constraints", () => {
    const result = prioritize({ currentState: {}, goal: { shortTerm: "تعلّم لغة" }, constraints: {} });
    expect(result).toContain("تعلّم لغة");
  });
});

describe("eliminate", () => {
  it("eliminates capital-needing options when money is constrained", () => {
    const result = eliminate(baseInput);
    expect(result).toContain("رأس مال");
  });

  it("returns open when no constraints", () => {
    const result = eliminate({ currentState: {}, goal: { shortTerm: "test" }, constraints: {} });
    expect(result).toContain("لا حاجة");
  });
});

describe("select", () => {
  it("returns minimal-cost decision for double constraint", () => {
    const result = select(baseInput);
    expect(result.decision).toContain("أصغر خطوة");
    expect(result.reasoning.length).toBeGreaterThan(20);
  });

  it("returns emotional decision when emotion-only", () => {
    const result = select({
      currentState: { emotional: "قلق" },
      goal: { shortTerm: "اتخاذ قرار" },
      constraints: {},
    });
    expect(result.decision).toContain("24 ساعة");
  });
});

describe("buildIgnoreList", () => {
  it("includes money-related ignores", () => {
    const list = buildIgnoreList(baseInput);
    expect(list.some((i) => i.includes("تمويل"))).toBe(true);
  });

  it("returns default list when no constraints", () => {
    const list = buildIgnoreList({
      currentState: {},
      goal: { shortTerm: "test" },
      constraints: {},
    });
    expect(list.length).toBeGreaterThan(0);
  });
});

describe("computeConfidence", () => {
  it("higher confidence with more inputs", () => {
    const low = computeConfidence({
      currentState: {},
      goal: { shortTerm: "test" },
      constraints: {},
    });
    const high = computeConfidence(baseInput);
    expect(high).toBeGreaterThan(low);
  });
});

describe("runDecisionPipeline", () => {
  it("returns complete decision", () => {
    const result = runDecisionPipeline(baseInput);
    expect(result.decision).toBeTruthy();
    expect(result.reasoning).toBeTruthy();
    expect(result.actionStep).toBeTruthy();
    expect(result.ignore.length).toBeGreaterThan(0);
    expect(result.pipeline).toHaveLength(5);
    expect(result.markdown).toContain("# قرار اليوم");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("pipeline contains all 5 stages", () => {
    const result = runDecisionPipeline(baseInput);
    const stages = result.pipeline.map((s) => s.stage);
    expect(stages).toEqual(["clarify", "prioritize", "eliminate", "select", "execute"]);
  });
});

describe("checkDecisionHealth", () => {
  it("returns healthy with insufficient data", () => {
    const result = checkDecisionHealth([]);
    expect(result.status).toBe("healthy");
  });

  it("detects stuck pattern with repeated goals", () => {
    const result = checkDecisionHealth([
      { decision: "a", goal: "أطلق المنتج", date: "2026-04-01" },
      { decision: "b", goal: "أطلق المنتج", date: "2026-04-02" },
      { decision: "c", goal: "أطلق المنتج", date: "2026-04-03" },
      { decision: "d", goal: "أطلق المنتج", date: "2026-04-04" },
    ]);
    expect(result.status).toBe("stuck");
    expect(result.patterns.length).toBeGreaterThan(0);
  });
});
