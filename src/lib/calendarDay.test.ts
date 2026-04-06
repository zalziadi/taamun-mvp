import { describe, it, expect } from "vitest";
import { computeCalendarDay } from "./calendarDay";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe("computeCalendarDay", () => {
  it("returns 1 when subscription_start_date is null", () => {
    expect(computeCalendarDay(null)).toBe(1);
  });

  it("returns 1 when subscription_start_date is undefined", () => {
    expect(computeCalendarDay(undefined)).toBe(1);
  });

  it("returns 1 on enrollment day (same day)", () => {
    const today = new Date();
    expect(computeCalendarDay(today.toISOString(), today)).toBe(1);
  });

  it("returns 2 on the day after enrollment", () => {
    const now = new Date("2026-04-06T10:00:00");
    expect(computeCalendarDay("2026-04-05T20:00:00", now)).toBe(2);
  });

  it("returns 4 when 3 days have passed (the bug scenario)", () => {
    // User enrolled 3 days ago, should be on day 4
    const now = new Date("2026-04-06T14:00:00");
    const startDate = "2026-04-03T09:00:00";
    expect(computeCalendarDay(startDate, now)).toBe(4);
  });

  it("returns correct day for a week of progress", () => {
    const now = new Date("2026-04-13T12:00:00");
    const startDate = "2026-04-06T08:00:00";
    expect(computeCalendarDay(startDate, now)).toBe(8);
  });

  it("clamps at 28 for dates beyond the program", () => {
    const now = new Date("2026-06-01T12:00:00");
    const startDate = "2026-04-01T08:00:00";
    expect(computeCalendarDay(startDate, now)).toBe(28);
  });

  it("returns 1 for future subscription dates", () => {
    const now = new Date("2026-04-06T12:00:00");
    const startDate = "2026-04-10T08:00:00"; // future
    expect(computeCalendarDay(startDate, now)).toBe(1);
  });

  it("handles midnight boundary correctly", () => {
    // Enrolled at 23:59, checking at 00:01 next day
    const now = new Date("2026-04-07T00:01:00");
    const startDate = "2026-04-06T23:59:00";
    // Both normalize to midnight: Apr 6 and Apr 7 = 1 day diff + 1 = day 2
    expect(computeCalendarDay(startDate, now)).toBe(2);
  });

  it("returns day 28 exactly on the last day", () => {
    const now = new Date("2026-05-03T12:00:00"); // 27 days after start
    const startDate = "2026-04-06T08:00:00";
    expect(computeCalendarDay(startDate, now)).toBe(28);
  });
});
