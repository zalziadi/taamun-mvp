import { describe, it, expect } from "vitest";
import { yearKeyForUser, parseYearKey } from "./yearKey";
import { YEAR_KEY_PATTERN } from "./types";

/**
 * Tests for Phase 11.03 yearKey helpers (YIR-04).
 *
 * Covers:
 *  1. activation_started_at anchor
 *  2. created_at fallback when activation_started_at is null
 *  3. current-year anniversary computation (use most recent anniversary <= now)
 *  4. parseYearKey round-trip with explicit anchor
 *  5. Invalid key → throws
 *  6. Null/invalid anchor → throws
 *
 * Deterministic: every call passes an explicit `now` Date to avoid clock flakes.
 */

describe("yearKeyForUser", () => {
  it("anchors on activation_started_at when present", () => {
    // Activation: 2026-03-01. now: 2027-04-20 Asia/Riyadh.
    // Most-recent completed-or-current anniversary is 2027-03-01.
    // Year-key = "2027_anniversary" (the YIR window 2027-03-01..2028-03-01).
    const key = yearKeyForUser(
      {
        activation_started_at: "2026-03-01T10:00:00Z",
        created_at: "2026-01-15T08:00:00Z",
      },
      new Date("2027-04-20T12:00:00Z")
    );
    expect(key).toBe("2027_anniversary");
    expect(YEAR_KEY_PATTERN.test(key)).toBe(true);
  });

  it("falls back to created_at when activation_started_at is null", () => {
    // No activation anchor, fallback to created_at 2025-06-15.
    // now: 2027-07-01 → most-recent anniversary is 2027-06-15 → "2027_anniversary".
    const key = yearKeyForUser(
      {
        activation_started_at: null,
        created_at: "2025-06-15T10:00:00Z",
      },
      new Date("2027-07-01T12:00:00Z")
    );
    expect(key).toBe("2027_anniversary");
  });

  it("uses previous-year anniversary when current-year anniversary not yet reached", () => {
    // Activation: 2026-09-01. now: 2027-03-01 (BEFORE the 2027-09-01 anniversary).
    // Most-recent completed anniversary = 2026-09-01 → year-key = "2026_anniversary".
    const key = yearKeyForUser(
      {
        activation_started_at: "2026-09-01T10:00:00Z",
        created_at: "2025-01-01T00:00:00Z",
      },
      new Date("2027-03-01T12:00:00Z")
    );
    expect(key).toBe("2026_anniversary");
  });

  it("anchors on activation day in Asia/Riyadh (not UTC)", () => {
    // Activation Instant: 2026-02-28T22:00:00Z = 2026-03-01 01:00 Asia/Riyadh.
    // So the anniversary day in Riyadh tz is March 1, not Feb 28.
    // now: 2027-03-01T00:00:00Z = 2027-03-01 03:00 Riyadh → current anniversary reached.
    const key = yearKeyForUser(
      {
        activation_started_at: "2026-02-28T22:00:00Z",
        created_at: "2026-02-28T22:00:00Z",
      },
      new Date("2027-03-01T05:00:00Z")
    );
    expect(key).toBe("2027_anniversary");
  });
});

describe("parseYearKey", () => {
  it("returns the [start, end) window for a valid key + anchor", () => {
    const anchor = new Date("2026-03-01T00:00:00Z");
    const { start, end } = parseYearKey("2027_anniversary", anchor);
    // Start = 2027-03-01, End = 2028-03-01 (exclusive upper bound).
    expect(start.toISOString().slice(0, 10)).toBe("2027-03-01");
    expect(end.toISOString().slice(0, 10)).toBe("2028-03-01");
    // End strictly after start.
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });

  it("round-trips: yearKeyForUser → parseYearKey gives a window that contains the anchor month/day", () => {
    const anchorIso = "2026-05-20T10:00:00Z";
    const key = yearKeyForUser(
      { activation_started_at: anchorIso, created_at: anchorIso },
      new Date("2027-06-01T00:00:00Z")
    );
    expect(key).toBe("2027_anniversary");
    const { start, end } = parseYearKey(key, new Date(anchorIso));
    // start should be on May 20 (activation day-of-year).
    expect(start.toISOString().slice(5, 10)).toBe("05-20");
    expect(end.toISOString().slice(5, 10)).toBe("05-20");
    expect(end.getUTCFullYear() - start.getUTCFullYear()).toBe(1);
  });

  it("throws on malformed year_key", () => {
    const anchor = new Date("2026-03-01T00:00:00Z");
    expect(() => parseYearKey("not_a_key", anchor)).toThrow();
    expect(() => parseYearKey("2027", anchor)).toThrow();
    expect(() => parseYearKey("anniversary_2027", anchor)).toThrow();
    expect(() => parseYearKey("", anchor)).toThrow();
  });

  it("throws on invalid anchor Date", () => {
    expect(() =>
      parseYearKey("2027_anniversary", new Date("not-a-date"))
    ).toThrow();
  });
});

describe("yearKeyForUser input validation", () => {
  it("throws when both activation_started_at and created_at are invalid", () => {
    expect(() =>
      yearKeyForUser(
        { activation_started_at: null, created_at: "not-a-date" },
        new Date("2027-04-20T12:00:00Z")
      )
    ).toThrow();
  });
});
