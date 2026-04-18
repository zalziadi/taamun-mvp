import { describe, it, expect } from "vitest";
import { computeCalendarDay } from "./calendarDay";

describe("computeCalendarDay", () => {
  it("returns 1 when subscription_start_date is null", () => {
    expect(computeCalendarDay(null)).toBe(1);
  });

  it("returns 1 when subscription_start_date is undefined", () => {
    expect(computeCalendarDay(undefined)).toBe(1);
  });

  it("returns 1 on enrollment day (same day)", () => {
    // Enrollment at 10:00 UTC = 13:00 Riyadh, checked at 11:00 UTC = 14:00 Riyadh (same Riyadh day)
    const startDate = "2026-03-01T10:00:00Z";
    const now = new Date("2026-03-01T11:00:00Z");
    expect(computeCalendarDay(startDate, now)).toBe(1);
  });

  it("returns 2 on the day after enrollment", () => {
    // Start 2026-04-05 (Riyadh), now 2026-04-06 (Riyadh)
    const now = new Date("2026-04-06T10:00:00Z"); // 13:00 Riyadh = Apr 6
    const startDate = "2026-04-05T17:00:00Z"; // 20:00 Riyadh = Apr 5
    expect(computeCalendarDay(startDate, now)).toBe(2);
  });

  it("returns 4 when 3 days have passed", () => {
    // Apr 3 Riyadh → Apr 6 Riyadh = 3 delta = day 4
    const now = new Date("2026-04-06T11:00:00Z"); // 14:00 Riyadh
    const startDate = "2026-04-03T06:00:00Z"; // 09:00 Riyadh
    expect(computeCalendarDay(startDate, now)).toBe(4);
  });

  it("returns correct day for a week of progress", () => {
    // Apr 6 Riyadh → Apr 13 Riyadh = day 8
    const now = new Date("2026-04-13T09:00:00Z"); // 12:00 Riyadh
    const startDate = "2026-04-06T05:00:00Z"; // 08:00 Riyadh
    expect(computeCalendarDay(startDate, now)).toBe(8);
  });

  it("clamps at 28 for dates beyond the program", () => {
    const now = new Date("2026-06-01T09:00:00Z"); // 12:00 Riyadh
    const startDate = "2026-04-01T05:00:00Z"; // 08:00 Riyadh
    expect(computeCalendarDay(startDate, now)).toBe(28);
  });

  it("returns 1 for future subscription dates", () => {
    const now = new Date("2026-04-06T09:00:00Z");
    const startDate = "2026-04-10T05:00:00Z"; // future
    expect(computeCalendarDay(startDate, now)).toBe(1);
  });

  it("returns day 28 exactly on the last day", () => {
    // Start Apr 6 Riyadh → May 3 Riyadh = 27 delta + 1 = day 28
    const now = new Date("2026-05-03T09:00:00Z"); // 12:00 Riyadh
    const startDate = "2026-04-06T05:00:00Z"; // 08:00 Riyadh
    expect(computeCalendarDay(startDate, now)).toBe(28);
  });

  // ─────────────────────────────────────────────────────────────────────
  // RETURN-06 / PITFALLS #3 — Asia/Riyadh invariant tests
  // ROADMAP Phase 7 Success Criterion #5:
  //   "A user activated at 23:00 Asia/Riyadh on day 27 who returns at
  //    06:00 the next morning correctly sees Day 28 (not Day 27 stuck
  //    due to UTC drift)."
  // ─────────────────────────────────────────────────────────────────────

  it("RETURN-06: user activated at 23:00 Riyadh on day 27 sees Day 28 at 06:00 next morning", () => {
    // Activation: 2026-03-01 23:00 Riyadh = 2026-03-01 20:00 UTC (enrollment = day 1 = March 1 Riyadh)
    const subscriptionStartDate = "2026-03-01T20:00:00Z";
    // "Day 27" in Riyadh = March 27 Riyadh.
    // User returns 06:00 next morning = 2026-03-29 06:00 Riyadh = 2026-03-29 03:00 UTC.
    // In Riyadh that's March 29 → day 29 clamped to 28.
    // This is the exact vector ROADMAP criterion #5 requires.
    const now = new Date("2026-03-29T03:00:00Z");
    expect(computeCalendarDay(subscriptionStartDate, now)).toBe(28);
  });

  it("RETURN-06: midnight Riyadh boundary — 23:00 Riyadh and 01:00 next day are different days", () => {
    // Start at Riyadh midnight boundary: 2026-03-05 20:59 UTC = 2026-03-05 23:59 Riyadh
    const startDate = "2026-03-05T20:59:00Z";
    // Check 2 hours later: 2026-03-05 22:59 UTC = 2026-03-06 01:59 Riyadh (next Riyadh day)
    const now = new Date("2026-03-05T22:59:00Z");
    // Riyadh calendar days: Mar 5 → Mar 6 = delta 1 → day 2
    expect(computeCalendarDay(startDate, now)).toBe(2);
  });

  it("RETURN-06: UTC-day rollover does NOT advance Riyadh day when both sides are same Riyadh day", () => {
    // 2026-03-05 21:30 UTC = 2026-03-06 00:30 Riyadh (already Mar 6 in Riyadh)
    // 2026-03-05 22:30 UTC = 2026-03-06 01:30 Riyadh (still Mar 6 in Riyadh)
    const startDate = "2026-03-05T21:30:00Z";
    const now = new Date("2026-03-05T22:30:00Z");
    // Same Riyadh calendar day → day 1
    expect(computeCalendarDay(startDate, now)).toBe(1);
  });

  it("graceful: returns 1 for unparseable date strings (no throw)", () => {
    expect(computeCalendarDay("not a date", new Date("2026-03-29T03:00:00Z"))).toBe(1);
  });
});
