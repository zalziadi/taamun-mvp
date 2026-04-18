import { describe, expect, it } from "vitest";
import {
  assertAllowedProperties,
  BANNED_PROPERTY_PATTERNS,
} from "./events";

describe("assertAllowedProperties", () => {
  describe("allowed property shapes", () => {
    it("does not throw for whitelisted keys like day_number", () => {
      expect(() =>
        assertAllowedProperties({ day_number: 7 })
      ).not.toThrow();
    });

    it("does not throw for badge_code", () => {
      expect(() =>
        assertAllowedProperties({ badge_code: "day-7" })
      ).not.toThrow();
    });

    it("does not throw for empty properties", () => {
      expect(() => assertAllowedProperties({})).not.toThrow();
    });

    it("does not throw for a realistic day_complete payload", () => {
      expect(() =>
        assertAllowedProperties({
          day_number: 7,
          cycle_number: 1,
          tier: "280",
        })
      ).not.toThrow();
    });
  });

  describe("banned property patterns (ANALYTICS-12)", () => {
    it("throws for user_email (matches *_email)", () => {
      expect(() =>
        assertAllowedProperties({ user_email: "a@b.com" })
      ).toThrowError(/user_email.*banned/);
    });

    it("throws for something_email (matches *_email)", () => {
      expect(() =>
        assertAllowedProperties({ something_email: "x" })
      ).toThrowError(/something_email.*banned/);
    });

    it("throws for user_phone (matches *_phone)", () => {
      expect(() =>
        assertAllowedProperties({ user_phone: "+966500000000" })
      ).toThrowError(/user_phone.*banned/);
    });

    it("throws for reflection_text (matches reflection_*)", () => {
      expect(() =>
        assertAllowedProperties({ reflection_text: "..." })
      ).toThrowError(/reflection_text.*banned/);
    });

    it("throws for verse_number (matches verse_*)", () => {
      expect(() =>
        assertAllowedProperties({ verse_number: 5 })
      ).toThrowError(/verse_number.*banned/);
    });

    it("throws for journal_entry (matches journal_*)", () => {
      expect(() =>
        assertAllowedProperties({ journal_entry: "..." })
      ).toThrowError(/journal_entry.*banned/);
    });

    it("throws for message_body (matches message_*)", () => {
      expect(() =>
        assertAllowedProperties({ message_body: "hi" })
      ).toThrowError(/message_body.*banned/);
    });

    it("throws for prayer_count (matches prayer_*)", () => {
      expect(() =>
        assertAllowedProperties({ prayer_count: 5 })
      ).toThrowError(/prayer_count.*banned/);
    });

    it("throws even when only one of several keys is banned", () => {
      expect(() =>
        assertAllowedProperties({
          day_number: 1,
          user_email: "leak@test.com",
        })
      ).toThrowError(/user_email.*banned/);
    });
  });

  describe("BANNED_PROPERTY_PATTERNS export", () => {
    it("exports exactly 7 patterns matching CONTEXT.md", () => {
      expect(BANNED_PROPERTY_PATTERNS).toHaveLength(7);
    });

    it("is an array of RegExp instances", () => {
      expect(Array.isArray(BANNED_PROPERTY_PATTERNS)).toBe(true);
      for (const pattern of BANNED_PROPERTY_PATTERNS) {
        expect(pattern).toBeInstanceOf(RegExp);
      }
    });
  });
});
