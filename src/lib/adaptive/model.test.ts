import { describe, it, expect } from "vitest";
import { DEFAULT_USER_MODEL, normalizeUserModel, clamp01 } from "./model";

describe("DEFAULT_USER_MODEL", () => {
  it("has all 5 fields with neutral values", () => {
    expect(DEFAULT_USER_MODEL.decisionThreshold).toBe(0.7);
    expect(DEFAULT_USER_MODEL.pressureSensitivity).toBe(0.5);
    expect(DEFAULT_USER_MODEL.reflectionDepthPreference).toBe(0.5);
    expect(DEFAULT_USER_MODEL.consistencyScore).toBe(0.5);
    expect(DEFAULT_USER_MODEL.resistanceLevel).toBe(0.5);
  });
});

describe("clamp01", () => {
  it("clamps below 0 to 0", () => expect(clamp01(-0.5)).toBe(0));
  it("clamps above 1 to 1", () => expect(clamp01(1.5)).toBe(1));
  it("preserves valid values", () => expect(clamp01(0.3)).toBe(0.3));
  it("rounds to 2 decimals", () => expect(clamp01(0.12345)).toBe(0.12));
});

describe("normalizeUserModel", () => {
  it("returns defaults for null", () => {
    expect(normalizeUserModel(null)).toEqual(expect.objectContaining(DEFAULT_USER_MODEL));
  });

  it("returns defaults for undefined", () => {
    expect(normalizeUserModel(undefined)).toEqual(expect.objectContaining(DEFAULT_USER_MODEL));
  });

  it("clamps invalid values", () => {
    const m = normalizeUserModel({
      decisionThreshold: 2.5,
      pressureSensitivity: -0.3,
      reflectionDepthPreference: 0.5,
      consistencyScore: 0.8,
      resistanceLevel: 0.4,
    });
    expect(m.decisionThreshold).toBe(1);
    expect(m.pressureSensitivity).toBe(0);
  });

  it("preserves partial input + fills missing fields with defaults", () => {
    const m = normalizeUserModel({ decisionThreshold: 0.4 });
    expect(m.decisionThreshold).toBe(0.4);
    expect(m.pressureSensitivity).toBe(DEFAULT_USER_MODEL.pressureSensitivity);
  });
});
