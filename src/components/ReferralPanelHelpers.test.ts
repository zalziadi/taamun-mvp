import { describe, it, expect } from "vitest";
import {
  STATUS_LABEL,
  buildShareText,
  buildWhatsAppHref,
  buildInstagramStoryHref,
  buildCopyText,
} from "./ReferralPanelHelpers";

/**
 * Unit tests for ReferralPanelHelpers (Plan 10.05, Task 2).
 *
 * These helpers are the single source of truth for:
 *   - Status label Arabic strings (REFER-11 transparency).
 *   - Share-text construction (da'wah framing per REFER-10).
 *   - Share-href builders (WhatsApp primary, IG fallback, copy fallback).
 *
 * Banned-vocabulary regex enforces NO gamification / affiliate / cash-out
 * vocabulary (SUMMARY §R4 + REFER-10).
 */

const BANNED_VOCAB = /earn|cash|reward|points|affiliate|commission|خصم|أرباح|سحب/i;
const ARABIC = /[\u0600-\u06FF]/;

describe("STATUS_LABEL", () => {
  it("1. has exactly 5 keys matching the referral status union", () => {
    const keys = Object.keys(STATUS_LABEL).sort();
    expect(keys).toEqual(
      [
        "pending_invitee",
        "pending_day14",
        "rewarded",
        "refunded",
        "void",
      ].sort(),
    );
  });

  it("2. every label contains Arabic characters", () => {
    for (const [, label] of Object.entries(STATUS_LABEL)) {
      expect(label).toMatch(ARABIC);
    }
  });
});

describe("buildShareText", () => {
  const CODE = "FRIEND-ABC123";
  const DOMAIN = "https://www.taamun.com";

  it("3. includes the code verbatim", () => {
    const text = buildShareText(CODE, DOMAIN);
    expect(text).toContain(CODE);
  });

  it("4. includes the app domain with ?ref={code} query", () => {
    const text = buildShareText(CODE, DOMAIN);
    expect(text).toContain(DOMAIN);
    expect(text).toContain(`?ref=${CODE}`);
  });

  it("5. does NOT contain any banned vocabulary token", () => {
    const text = buildShareText(CODE, DOMAIN);
    expect(text).not.toMatch(BANNED_VOCAB);
  });
});

describe("buildWhatsAppHref", () => {
  it("6. round-trips through decodeURIComponent to the original text", () => {
    const text = "تمعّن — ٢٨ يومًا مع القرآن. كود: FRIEND-ABC123";
    const href = buildWhatsAppHref(text);
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    const encoded = href.slice("https://wa.me/?text=".length);
    expect(decodeURIComponent(encoded)).toBe(text);
  });
});

describe("buildCopyText === buildShareText", () => {
  it("7. returns identical string to buildShareText (single source of truth)", () => {
    const CODE = "FRIEND-XYZ987";
    const DOMAIN = "https://www.taamun.com";
    expect(buildCopyText(CODE, DOMAIN)).toBe(buildShareText(CODE, DOMAIN));
  });
});

describe("buildInstagramStoryHref", () => {
  it("8. returns an instagram.com URL (IG Web has no prefilled-story API)", () => {
    const href = buildInstagramStoryHref(
      "FRIEND-ABC123",
      "https://www.taamun.com",
    );
    expect(href).toMatch(/^https:\/\/(www\.)?instagram\.com\//);
  });
});
