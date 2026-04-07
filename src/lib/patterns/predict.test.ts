import { describe, it, expect } from "vitest";
import {
  predictDecisionNeed,
  predictDecisionNeedDetailed,
  patternsContainHesitation,
  entriesRepeatHesitation,
} from "./predict";

describe("patternsContainHesitation", () => {
  it("detects hesitation in patterns", () => {
    const result = patternsContainHesitation(["تردد", "أمان"]);
    expect(result.yes).toBe(true);
    expect(result.matched).toContain("تردد");
  });

  it("returns false for non-hesitation patterns", () => {
    const result = patternsContainHesitation(["إقدام", "وضوح"]);
    expect(result.yes).toBe(false);
  });

  it("matches partial inclusion", () => {
    const result = patternsContainHesitation(["نمط من التأجيل"]);
    expect(result.yes).toBe(true);
    expect(result.matched).toContain("تأجيل");
  });
});

describe("entriesRepeatHesitation", () => {
  it("detects repeat in last 3 entries", () => {
    const result = entriesRepeatHesitation([
      "يوم عادي",
      "أشعر بتردد",
      "ما زال التردد موجود",
    ]);
    expect(result.repeated).toBe(true);
    expect(result.count).toBe(2);
  });

  it("does not flag single occurrence", () => {
    const result = entriesRepeatHesitation([
      "يوم عادي",
      "تردد واحد فقط",
      "كل شيء بخير",
    ]);
    expect(result.repeated).toBe(false);
  });

  it("returns false for empty entries", () => {
    const result = entriesRepeatHesitation([]);
    expect(result.repeated).toBe(false);
  });
});

describe("predictDecisionNeed", () => {
  it("returns 0 for no signals", () => {
    expect(predictDecisionNeed({ patterns: [], recentEntries: [] })).toBe(0);
  });

  it("returns 0.4 for hesitation pattern only", () => {
    expect(predictDecisionNeed({ patterns: ["تردد"], recentEntries: [] })).toBe(0.4);
  });

  it("compounds pattern + repeat", () => {
    const result = predictDecisionNeed({
      patterns: ["تردد"],
      recentEntries: ["تردد", "تردد"],
    });
    // 0.4 (pattern) + 0.3 (repeat) + 0.1 (compound) = 0.8
    expect(result).toBeGreaterThan(0.7);
  });

  it("adds 0.2 for low commitment", () => {
    const result = predictDecisionNeed({
      patterns: [],
      recentEntries: [],
      commitmentScore: 30,
    });
    expect(result).toBe(0.2);
  });

  it("clamps at 1", () => {
    const result = predictDecisionNeed({
      patterns: ["تردد", "حيرة"],
      recentEntries: ["تردد", "حيرة", "تأجيل"],
      commitmentScore: 10,
    });
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe("predictDecisionNeedDetailed", () => {
  it("returns signals array with reasons", () => {
    const result = predictDecisionNeedDetailed({
      patterns: ["تردد"],
      recentEntries: ["تردد"],
      commitmentScore: 30,
    });
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.signals.some((s) => s.includes("تردد"))).toBe(true);
  });

  it("returns empty signals when no triggers", () => {
    const result = predictDecisionNeedDetailed({
      patterns: ["إقدام"],
      recentEntries: ["يوم جميل"],
      commitmentScore: 80,
    });
    expect(result.signals.length).toBe(0);
    expect(result.probability).toBe(0);
  });
});
