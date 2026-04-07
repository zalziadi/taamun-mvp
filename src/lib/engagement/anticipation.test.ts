import { describe, it, expect } from "vitest";
import { buildAnticipation, nextMilestoneAfter, buildHint, STREAK_MILESTONES } from "./anticipation";

describe("nextMilestoneAfter", () => {
  it("returns 3 for streak 0", () => expect(nextMilestoneAfter(0)).toBe(3));
  it("returns 7 for streak 5", () => expect(nextMilestoneAfter(5)).toBe(7));
  it("returns 14 for streak 10", () => expect(nextMilestoneAfter(10)).toBe(14));
  it("returns 28 for streak 27", () => expect(nextMilestoneAfter(27)).toBe(28));
  it("returns 28 for streak >= 28", () => expect(nextMilestoneAfter(30)).toBe(28));
});

describe("buildHint", () => {
  it("returns restart hint for negative momentum", () => {
    expect(buildHint(0, -3)).toContain("الجمود");
  });

  it("first day hint for streak 0", () => {
    expect(buildHint(0, 5)).toContain("الأول");
  });

  it("under 3 days = 'two more days'", () => {
    expect(buildHint(1, 5)).toContain("يومين");
  });

  it("3-7 days = 'higher clarity'", () => {
    expect(buildHint(5, 5)).toContain("وضوح");
  });

  it("8-14 days = 'inner stability'", () => {
    expect(buildHint(10, 5)).toContain("استقرار");
  });

  it("15-21 days = 'identity'", () => {
    expect(buildHint(18, 5)).toContain("هوية");
  });

  it("22+ days = 'completion'", () => {
    expect(buildHint(25, 5)).toContain("الرحلة");
  });
});

describe("buildAnticipation", () => {
  it("returns full anticipation object", () => {
    const a = buildAnticipation({ streak: 5, momentum: 4 });
    expect(a.hint).toBeTruthy();
    expect(a.progress).toBeGreaterThanOrEqual(0);
    expect(a.progress).toBeLessThanOrEqual(1);
    expect(a.nextMilestone).toBe(7);
  });

  it("normalizes progress to 0-1", () => {
    const zero = buildAnticipation({ streak: 0, momentum: 0 });
    const half = buildAnticipation({ streak: 14, momentum: 0 });
    const full = buildAnticipation({ streak: 28, momentum: 0 });
    expect(zero.progress).toBe(0);
    expect(half.progress).toBe(0.5);
    expect(full.progress).toBe(1);
  });

  it("clamps streak above 28", () => {
    const result = buildAnticipation({ streak: 50, momentum: 5 });
    expect(result.progress).toBe(1);
    expect(result.nextMilestone).toBe(28);
  });

  it("clamps negative streak to 0", () => {
    const result = buildAnticipation({ streak: -5, momentum: 0 });
    expect(result.progress).toBe(0);
  });
});
