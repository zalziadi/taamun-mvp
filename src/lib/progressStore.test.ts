import { describe, it, expect } from "vitest";

// Test the day advancement logic extracted from the POST handler
function computeCurrentDay(
  storedCurrentDay: number,
  completedDays: number[],
  calendarDay: number,
  totalDays = 28
): number {
  const completionDay = completedDays.includes(storedCurrentDay)
    ? Math.min(totalDays, storedCurrentDay + 1)
    : storedCurrentDay;
  return Math.max(completionDay, calendarDay);
}

describe("day advancement logic", () => {
  it("stays at stored day when nothing completed and calendar matches", () => {
    expect(computeCurrentDay(2, [], 2)).toBe(2);
  });

  it("advances by completion when current day is completed", () => {
    expect(computeCurrentDay(2, [1, 2], 2)).toBe(3);
  });

  it("jumps to calendar day when time has passed without completion", () => {
    // Stored at day 2, nothing completed, but calendar says day 4
    expect(computeCurrentDay(2, [], 4)).toBe(4);
  });

  it("uses calendar day when higher than completion-based day", () => {
    // Stored at day 2, completed day 2 (→ day 3), but calendar says day 5
    expect(computeCurrentDay(2, [1, 2], 5)).toBe(5);
  });

  it("uses completion day when higher than calendar", () => {
    // User completed rapidly, ahead of calendar
    expect(computeCurrentDay(5, [1, 2, 3, 4, 5], 3)).toBe(6);
  });

  it("clamps at TOTAL_DAYS", () => {
    expect(computeCurrentDay(28, [28], 28)).toBe(28);
  });

  it("does not advance when current day is not in completed list", () => {
    // On day 3, completed days 1 and 2 but NOT 3
    expect(computeCurrentDay(3, [1, 2], 3)).toBe(3);
  });

  it("the original bug: stored=2, calendar=4 → should be 4", () => {
    expect(computeCurrentDay(2, [1], 4)).toBe(4);
  });
});
