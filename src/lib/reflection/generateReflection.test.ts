import { describe, it, expect } from "vitest";
import { generateReflection, generateReflectionDetailed, REFLECTIONS } from "./generateReflection";
import type { UserPattern } from "../patterns/userPattern";

const makePattern = (type: UserPattern["type"]): UserPattern => ({
  type,
  decisionResistance: 0.5,
  reflectionAffinity: 0.5,
  actionSpeed: 0.5,
  confidence: 0.5,
  reasons: [],
});

describe("generateReflection", () => {
  it("returns avoidant message for avoidant pattern", () => {
    const msg = generateReflection(makePattern("avoidant"));
    expect(REFLECTIONS.avoidant.some((r) => r.message === msg)).toBe(true);
  });

  it("returns decisive message for decisive pattern", () => {
    const msg = generateReflection(makePattern("decisive"));
    expect(REFLECTIONS.decisive.some((r) => r.message === msg)).toBe(true);
  });

  it("returns explorer message for explorer pattern", () => {
    const msg = generateReflection(makePattern("explorer"));
    expect(REFLECTIONS.explorer.some((r) => r.message === msg)).toBe(true);
  });

  it("returns balanced message for balanced pattern", () => {
    const msg = generateReflection(makePattern("balanced"));
    expect(REFLECTIONS.balanced.some((r) => r.message === msg)).toBe(true);
  });

  it("is deterministic for same pattern", () => {
    const a = generateReflection(makePattern("avoidant"));
    const b = generateReflection(makePattern("avoidant"));
    expect(a).toBe(b);
  });
});

describe("generateReflectionDetailed", () => {
  it("returns full reflection object with tone + emphasis", () => {
    const result = generateReflectionDetailed(makePattern("avoidant"));
    expect(result.message).toBeTruthy();
    expect(result.tone).toBe("firm");
    expect(result.emphasis).toBe("high");
  });

  it("decisive returns challenging tone", () => {
    expect(generateReflectionDetailed(makePattern("decisive")).tone).toBe("challenging");
  });

  it("explorer returns warm tone", () => {
    expect(generateReflectionDetailed(makePattern("explorer")).tone).toBe("warm");
  });
});

describe("REFLECTIONS catalog", () => {
  it("has at least 1 message per pattern type", () => {
    expect(REFLECTIONS.avoidant.length).toBeGreaterThan(0);
    expect(REFLECTIONS.decisive.length).toBeGreaterThan(0);
    expect(REFLECTIONS.explorer.length).toBeGreaterThan(0);
    expect(REFLECTIONS.balanced.length).toBeGreaterThan(0);
  });
});
