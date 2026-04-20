import { describe, it, expect } from "vitest";
import {
  YEAR_KEY_PATTERN,
  isYIRPublicStats,
  type YIRPublicStats,
  type YIRPrivateContent,
} from "./types";

/**
 * Tests for Phase 11.02 type-split privacy enforcement (YIR-08, YIR-11).
 *
 * This file is the compile-time + runtime proof that:
 *   (a) YIRPublicStats and YIRPrivateContent are NON-INTERSECTING types.
 *   (b) A function typed to accept YIRPublicStats CANNOT accept YIRPrivateContent.
 *   (c) YIRPublicStats contains ONLY counts/averages/timestamps — never user text.
 *   (d) YEAR_KEY_PATTERN validates the "YYYY_anniversary" format.
 *
 * Pattern inspiration: src/lib/referral/generate.test.ts (co-located, vitest,
 * zero new deps per NFR-08).
 */

// -----------------------------------------------------------------------------
// Type-level helpers (Effective TypeScript item 52)
// -----------------------------------------------------------------------------

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

// -----------------------------------------------------------------------------
// Compile-time: YIRPublicStats and YIRPrivateContent are key-disjoint
// -----------------------------------------------------------------------------

describe("type-split compile-time invariant (YIR-08)", () => {
  it("YIRPublicStats and YIRPrivateContent share ZERO keys", () => {
    // If this line ever stops compiling, a field was added that bridges the
    // two types — a privacy regression. Fix by renaming one side.
    const _assertDisjoint: Equal<
      Extract<keyof YIRPublicStats, keyof YIRPrivateContent>,
      never
    > = true;
    expect(_assertDisjoint).toBe(true);
  });

  it("a function accepting YIRPublicStats rejects YIRPrivateContent at compile time", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function renderShareCard(_stats: YIRPublicStats): string {
      return "ok";
    }

    const publicStats: YIRPublicStats = {
      reflections_count: 30,
      awareness_avg: 0.6,
      milestones_reached: ["first_reflection"],
      cycle_count: 1,
      earliest_reflection_at: "2026-04-01T00:00:00Z",
      latest_reflection_at: "2026-05-01T00:00:00Z",
      awareness_trajectory: [0.5, 0.6, 0.7],
    };
    expect(renderShareCard(publicStats)).toBe("ok");

    const privateContent: YIRPrivateContent = {
      reflection_text: "secret",
      emotion_labels: ["joy"],
      guide_messages: ["hi"],
    };

    // @ts-expect-error — PITFALL #10: YIRPrivateContent must NOT flow into
    // any share-card renderer. If this line compiles, the types have bled.
    renderShareCard(privateContent);

    // Runtime read to avoid "declared but never used" on the private sample.
    expect(privateContent.reflection_text).toBe("secret");
  });

  it("YIRPublicStats rejects attempts to read reflection_text / emotion_labels / guide_messages", () => {
    const stats: YIRPublicStats = {
      reflections_count: 0,
      awareness_avg: null,
      milestones_reached: [],
      cycle_count: 0,
      earliest_reflection_at: null,
      latest_reflection_at: null,
      awareness_trajectory: [],
    };

    // @ts-expect-error — reflection_text is NOT a public field
    const _t: string = stats.reflection_text;
    // @ts-expect-error — emotion_labels is NOT a public field
    const _e: readonly string[] = stats.emotion_labels;
    // @ts-expect-error — guide_messages is NOT a public field
    const _g: readonly string[] = stats.guide_messages;
    // @ts-expect-error — user_email is NOT a public field
    const _em: string = stats.user_email;
    // @ts-expect-error — user_name is NOT a public field
    const _n: string = stats.user_name;

    expect(stats.reflections_count).toBe(0);
  });
});

// -----------------------------------------------------------------------------
// Runtime: YEAR_KEY_PATTERN
// -----------------------------------------------------------------------------

describe("YEAR_KEY_PATTERN", () => {
  it("accepts YYYY_anniversary", () => {
    expect(YEAR_KEY_PATTERN.test("2027_anniversary")).toBe(true);
    expect(YEAR_KEY_PATTERN.test("2026_anniversary")).toBe(true);
  });

  it("rejects plain year", () => {
    expect(YEAR_KEY_PATTERN.test("2027")).toBe(false);
  });

  it("rejects reversed order", () => {
    expect(YEAR_KEY_PATTERN.test("anniversary_2027")).toBe(false);
  });

  it("rejects wrong year length", () => {
    expect(YEAR_KEY_PATTERN.test("27_anniversary")).toBe(false);
    expect(YEAR_KEY_PATTERN.test("20270_anniversary")).toBe(false);
  });

  it("rejects empty / missing underscore", () => {
    expect(YEAR_KEY_PATTERN.test("")).toBe(false);
    expect(YEAR_KEY_PATTERN.test("2027anniversary")).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// Runtime: isYIRPublicStats shape guard
// -----------------------------------------------------------------------------

describe("isYIRPublicStats", () => {
  const valid: YIRPublicStats = {
    reflections_count: 42,
    awareness_avg: 0.72,
    milestones_reached: ["first_reflection", "week_one"],
    cycle_count: 2,
    earliest_reflection_at: "2026-04-01T00:00:00Z",
    latest_reflection_at: "2027-04-01T00:00:00Z",
    awareness_trajectory: [0.3, 0.5, 0.7],
  };

  it("accepts a well-formed payload", () => {
    expect(isYIRPublicStats(valid)).toBe(true);
  });

  it("accepts null awareness_avg (cold-start user)", () => {
    expect(isYIRPublicStats({ ...valid, awareness_avg: null })).toBe(true);
  });

  it("accepts empty milestones_reached and empty trajectory", () => {
    expect(
      isYIRPublicStats({
        ...valid,
        milestones_reached: [],
        awareness_trajectory: [],
      }),
    ).toBe(true);
  });

  it("rejects null", () => {
    expect(isYIRPublicStats(null)).toBe(false);
  });

  it("rejects non-object primitives", () => {
    expect(isYIRPublicStats("hello")).toBe(false);
    expect(isYIRPublicStats(42)).toBe(false);
    expect(isYIRPublicStats(undefined)).toBe(false);
  });

  it("rejects missing reflections_count", () => {
    const { reflections_count: _omit, ...rest } = valid;
    expect(isYIRPublicStats(rest)).toBe(false);
  });

  it("rejects non-array milestones_reached", () => {
    expect(
      isYIRPublicStats({ ...valid, milestones_reached: "first_reflection" }),
    ).toBe(false);
  });

  it("rejects non-array awareness_trajectory", () => {
    expect(isYIRPublicStats({ ...valid, awareness_trajectory: 0.5 })).toBe(
      false,
    );
  });

  it("rejects string awareness_avg", () => {
    expect(isYIRPublicStats({ ...valid, awareness_avg: "0.5" })).toBe(false);
  });
});
