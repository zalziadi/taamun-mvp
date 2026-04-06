import { describe, it, expect } from "vitest";
import { buildProgressState, buildCatchUpData } from "./progressEngine";

describe("buildProgressState", () => {
  const base = (overrides: Record<string, any> = {}) =>
    buildProgressState(
      overrides.storedDay ?? 3,
      overrides.completedDays ?? [1, 2, 3],
      overrides.startDate ?? "2026-04-01T00:00:00",
      overrides.hasRecovery ?? false,
      overrides.now ?? new Date("2026-04-04T12:00:00")
    );

  it("returns normal mode when drift is 0", () => {
    const s = base({ storedDay: 4, now: new Date("2026-04-04T12:00:00") });
    expect(s.drift).toBe(0);
    expect(s.mode).toBe("normal");
  });

  it("returns catch_up mode when drift is 3-5", () => {
    const s = base({ storedDay: 1, now: new Date("2026-04-05T12:00:00") });
    expect(s.drift).toBeGreaterThanOrEqual(3);
    expect(s.mode).toBe("catch_up");
  });

  it("returns intervention mode when drift > 5", () => {
    const s = base({ storedDay: 1, now: new Date("2026-04-08T12:00:00") });
    expect(s.drift).toBeGreaterThan(5);
    expect(s.mode).toBe("intervention");
  });

  it("returns recovery_boost when hasRecentRecovery and drift", () => {
    const s = base({ storedDay: 1, hasRecovery: true, now: new Date("2026-04-04T12:00:00") });
    expect(s.mode).toBe("recovery_boost");
  });

  it("calculates missed days correctly", () => {
    const s = base({ storedDay: 1, completedDays: [1], now: new Date("2026-04-05T12:00:00") });
    expect(s.missedDays).toContain(2);
    expect(s.missedDays).toContain(3);
    expect(s.missedDays).not.toContain(1);
  });

  it("calculates streak correctly", () => {
    const s = base({ storedDay: 4, completedDays: [2, 3, 4], now: new Date("2026-04-04T12:00:00") });
    expect(s.streak).toBe(3);
  });

  it("calculates completionRate", () => {
    const s = base({ storedDay: 4, completedDays: [1, 2], now: new Date("2026-04-04T12:00:00") });
    expect(s.completionRate).toBe(0.5);
  });
});

describe("buildCatchUpData", () => {
  it("returns null for normal mode", () => {
    const state = buildProgressState(4, [1, 2, 3, 4], "2026-04-01", false, new Date("2026-04-04T12:00:00"));
    expect(buildCatchUpData(state)).toBeNull();
  });

  it("returns catch_up data with options", () => {
    const state = buildProgressState(1, [1], "2026-04-01", false, new Date("2026-04-06T12:00:00"));
    const catchUp = buildCatchUpData(state);
    expect(catchUp).not.toBeNull();
    expect(catchUp!.options.length).toBeGreaterThanOrEqual(2);
    expect(catchUp!.missedDays.length).toBeGreaterThan(0);
  });
});
