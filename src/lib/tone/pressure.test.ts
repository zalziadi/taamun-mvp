import { describe, it, expect } from "vitest";
import { detectPressure, classifyPressure, buildPressureCTA, applyPressureToMessage } from "./pressure";

describe("detectPressure", () => {
  it("returns baseline 0.5 for neutral state", () => {
    const p = detectPressure({ resistance: 0, momentum: 0, commitment: 60 });
    expect(p).toBeGreaterThanOrEqual(0.4);
    expect(p).toBeLessThanOrEqual(0.6);
  });

  it("reduces pressure for high resistance", () => {
    const high = detectPressure({ resistance: 0.8, momentum: 0, commitment: 60 });
    const low = detectPressure({ resistance: 0, momentum: 0, commitment: 60 });
    expect(high).toBeLessThan(low);
  });

  it("increases pressure for high momentum", () => {
    const high = detectPressure({ resistance: 0, momentum: 8, commitment: 60 });
    const low = detectPressure({ resistance: 0, momentum: 0, commitment: 60 });
    expect(high).toBeGreaterThan(low);
  });

  it("reduces pressure for low commitment", () => {
    const lowCommit = detectPressure({ resistance: 0, momentum: 0, commitment: 20 });
    const normalCommit = detectPressure({ resistance: 0, momentum: 0, commitment: 60 });
    expect(lowCommit).toBeLessThan(normalCommit);
  });

  it("clamps to 0-1", () => {
    const max = detectPressure({ resistance: 0, momentum: 10, commitment: 100 });
    const min = detectPressure({ resistance: 1, momentum: -10, commitment: 0 });
    expect(max).toBeLessThanOrEqual(1);
    expect(min).toBeGreaterThanOrEqual(0);
  });
});

describe("classifyPressure", () => {
  it("classifies levels correctly", () => {
    expect(classifyPressure(0.1)).toBe("gentle");
    expect(classifyPressure(0.3)).toBe("soft");
    expect(classifyPressure(0.5)).toBe("moderate");
    expect(classifyPressure(0.7)).toBe("firm");
    expect(classifyPressure(0.9)).toBe("urgent");
  });
});

describe("buildPressureCTA", () => {
  it("returns gentle CTA for low pressure", () => {
    const cta = buildPressureCTA(0.1);
    expect(cta).toBeTruthy();
    expect(cta.length).toBeGreaterThan(3);
  });

  it("returns urgent CTA for high pressure", () => {
    const cta = buildPressureCTA(0.95);
    expect(cta).toBeTruthy();
    // Urgent CTAs should have urgency cue
    expect(cta).toMatch(/الآن|لا تؤجل|الوقت/);
  });

  it("is deterministic", () => {
    expect(buildPressureCTA(0.5)).toBe(buildPressureCTA(0.5));
  });
});

describe("applyPressureToMessage", () => {
  it("adds 'برفق' for gentle", () => {
    expect(applyPressureToMessage("ابدأ", 0.1)).toContain("برفق");
  });

  it("adds 'الآن' for urgent", () => {
    expect(applyPressureToMessage("ابدأ", 0.9)).toContain("الآن");
  });

  it("returns message as-is for moderate", () => {
    expect(applyPressureToMessage("ابدأ", 0.5)).toBe("ابدأ");
  });
});
