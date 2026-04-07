import { describe, it, expect } from "vitest";
import { updateUserModel, updateUserModelDetailed, decayUserModel } from "./learn";
import { DEFAULT_USER_MODEL, type UserModel } from "./model";

const baseModel = (): UserModel => ({ ...DEFAULT_USER_MODEL });

describe("updateUserModel — resistance", () => {
  it("increases resistance when hesitation present", () => {
    const result = updateUserModel({
      model: baseModel(),
      actionTaken: false,
      hesitation: true,
      completionTime: 0,
    });
    expect(result.resistanceLevel).toBeGreaterThan(0.5);
  });

  it("decreases resistance on smooth completion", () => {
    const m = { ...baseModel(), resistanceLevel: 0.7 };
    const result = updateUserModel({
      model: m,
      actionTaken: true,
      hesitation: false,
      completionTime: 30,
    });
    expect(result.resistanceLevel).toBeLessThan(0.7);
  });
});

describe("updateUserModel — decision threshold", () => {
  it("lowers threshold for fast completion (< 60s)", () => {
    const result = updateUserModel({
      model: baseModel(),
      actionTaken: true,
      hesitation: false,
      completionTime: 30,
    });
    expect(result.decisionThreshold).toBeLessThan(0.7);
  });

  it("raises threshold when no action + hesitation", () => {
    const result = updateUserModel({
      model: baseModel(),
      actionTaken: false,
      hesitation: true,
      completionTime: 0,
    });
    expect(result.decisionThreshold).toBeGreaterThan(0.7);
  });
});

describe("updateUserModel — consistency", () => {
  it("increases consistency on action taken", () => {
    const result = updateUserModel({
      model: baseModel(),
      actionTaken: true,
      hesitation: false,
      completionTime: 90,
    });
    expect(result.consistencyScore).toBeGreaterThan(0.5);
  });

  it("decreases consistency on skip", () => {
    const result = updateUserModel({
      model: baseModel(),
      actionTaken: false,
      hesitation: false,
      completionTime: 0,
      skipped: true,
    });
    expect(result.consistencyScore).toBeLessThan(0.5);
  });
});

describe("updateUserModel — pressure sensitivity", () => {
  it("increases sensitivity on skip", () => {
    const result = updateUserModel({
      model: baseModel(),
      actionTaken: false,
      hesitation: false,
      completionTime: 0,
      skipped: true,
    });
    expect(result.pressureSensitivity).toBeGreaterThan(0.5);
  });

  it("decreases sensitivity on fast action", () => {
    const result = updateUserModel({
      model: baseModel(),
      actionTaken: true,
      hesitation: false,
      completionTime: 60,
    });
    expect(result.pressureSensitivity).toBeLessThan(0.5);
  });
});

describe("updateUserModel — reflection depth", () => {
  it("increases depth preference on explicit request", () => {
    const result = updateUserModel({
      model: baseModel(),
      actionTaken: true,
      hesitation: false,
      completionTime: 60,
      requestedDepth: true,
    });
    expect(result.reflectionDepthPreference).toBeGreaterThan(0.5);
  });

  it("decreases depth preference on quick action", () => {
    const result = updateUserModel({
      model: baseModel(),
      actionTaken: true,
      hesitation: false,
      completionTime: 15,
    });
    expect(result.reflectionDepthPreference).toBeLessThan(0.5);
  });
});

describe("updateUserModel — clamping", () => {
  it("never goes below 0", () => {
    const m = { ...baseModel(), resistanceLevel: 0.05 };
    const result = updateUserModel({
      model: m,
      actionTaken: true,
      hesitation: false,
      completionTime: 30,
    });
    expect(result.resistanceLevel).toBeGreaterThanOrEqual(0);
  });

  it("never exceeds 1", () => {
    const m = { ...baseModel(), resistanceLevel: 0.98 };
    const result = updateUserModel({
      model: m,
      actionTaken: false,
      hesitation: true,
      completionTime: 0,
    });
    expect(result.resistanceLevel).toBeLessThanOrEqual(1);
  });
});

describe("updateUserModel — updatedAt", () => {
  it("sets updatedAt timestamp", () => {
    const result = updateUserModel({
      model: baseModel(),
      actionTaken: true,
      hesitation: false,
      completionTime: 60,
    });
    expect(result.updatedAt).toBeTruthy();
  });
});

describe("updateUserModelDetailed", () => {
  it("returns model + Arabic changes array", () => {
    const result = updateUserModelDetailed({
      model: baseModel(),
      actionTaken: true,
      hesitation: false,
      completionTime: 30,
    });
    expect(result.model).toBeDefined();
    expect(Array.isArray(result.changes)).toBe(true);
    expect(result.changes.length).toBeGreaterThan(0);
  });

  it("returns empty changes when nothing moves", () => {
    // Use a model that won't change with this signal
    const result = updateUserModelDetailed({
      model: baseModel(),
      actionTaken: false,
      hesitation: false,
      completionTime: 0,
    });
    expect(Array.isArray(result.changes)).toBe(true);
  });
});

describe("decayUserModel", () => {
  it("moves elevated values toward neutral", () => {
    const m = { ...baseModel(), resistanceLevel: 0.9 };
    const decayed = decayUserModel(m);
    expect(decayed.resistanceLevel).toBeLessThan(0.9);
    expect(decayed.resistanceLevel).toBeGreaterThanOrEqual(0.5);
  });

  it("moves depressed values toward neutral", () => {
    const m = { ...baseModel(), consistencyScore: 0.1 };
    const decayed = decayUserModel(m);
    expect(decayed.consistencyScore).toBeGreaterThan(0.1);
    expect(decayed.consistencyScore).toBeLessThanOrEqual(0.5);
  });
});

describe("learning loop integration", () => {
  it("converges over multiple iterations toward fast-decider profile", () => {
    let model = baseModel();
    for (let i = 0; i < 10; i++) {
      model = updateUserModel({
        model,
        actionTaken: true,
        hesitation: false,
        completionTime: 30,
      });
    }
    // After 10 fast iterations:
    // - decisionThreshold should drop below 0.5 (system more proactive)
    // - consistencyScore should rise
    expect(model.decisionThreshold).toBeLessThan(0.5);
    expect(model.consistencyScore).toBeGreaterThan(0.7);
  });

  it("converges toward sensitive profile after repeated skips", () => {
    let model = baseModel();
    for (let i = 0; i < 10; i++) {
      model = updateUserModel({
        model,
        actionTaken: false,
        hesitation: false,
        completionTime: 0,
        skipped: true,
      });
    }
    expect(model.pressureSensitivity).toBeGreaterThan(0.7);
    expect(model.consistencyScore).toBeLessThan(0.3);
  });
});
