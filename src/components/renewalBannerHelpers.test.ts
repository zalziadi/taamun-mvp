/**
 * RenewalBanner — logic-only tests.
 *
 * Covers the pure helpers that back the RenewalBanner component:
 *   - `gatewayCtaHref` — 4 gateway branches + env-fallback envelope
 *   - `isDismissedFrom` — 48h window + 3-dismissal cap
 *
 * Imports from ./renewalBannerHelpers (a plain .ts sibling of the .tsx
 * component). This repo has no vitest JSX transform configured, so we keep
 * the helpers in a pure .ts module for testability. The component file itself
 * re-exports nothing testable beyond React render behavior, which is covered
 * at the integration layer in Plan 09.07.
 *
 * Why not @testing-library/react: CLAUDE.md rule 6 + Plan 09.04 NFR-08 forbid
 * new deps, and RTL + jsdom are not installed.
 */

import { describe, expect, it } from "vitest";
import {
  DISMISS_COUNT_KEY,
  DISMISS_KEY,
  gatewayCtaHref,
  isDismissedFrom,
} from "./renewalBannerHelpers";

describe("gatewayCtaHref", () => {
  it("falls back to /pricing?source=expired&gateway=salla when NEXT_PUBLIC_SALLA_RENEWAL_URL unset", () => {
    const prev = process.env.NEXT_PUBLIC_SALLA_RENEWAL_URL;
    delete process.env.NEXT_PUBLIC_SALLA_RENEWAL_URL;
    try {
      expect(gatewayCtaHref("salla")).toBe(
        "/pricing?source=expired&gateway=salla"
      );
    } finally {
      if (prev !== undefined) process.env.NEXT_PUBLIC_SALLA_RENEWAL_URL = prev;
    }
  });

  it("falls back to /pricing?source=expired&gateway=tap when NEXT_PUBLIC_TAP_RENEWAL_URL unset", () => {
    const prev = process.env.NEXT_PUBLIC_TAP_RENEWAL_URL;
    delete process.env.NEXT_PUBLIC_TAP_RENEWAL_URL;
    try {
      expect(gatewayCtaHref("tap")).toBe(
        "/pricing?source=expired&gateway=tap"
      );
    } finally {
      if (prev !== undefined) process.env.NEXT_PUBLIC_TAP_RENEWAL_URL = prev;
    }
  });

  it("falls back to /pricing?source=expired&gateway=stripe when NEXT_PUBLIC_STRIPE_PORTAL_URL unset", () => {
    const prev = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL;
    delete process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL;
    try {
      expect(gatewayCtaHref("stripe")).toBe(
        "/pricing?source=expired&gateway=stripe"
      );
    } finally {
      if (prev !== undefined) process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL = prev;
    }
  });

  it("routes eid_code to /pricing?source=expired (no gateway query)", () => {
    expect(gatewayCtaHref("eid_code")).toBe("/pricing?source=expired");
  });

  it("uses NEXT_PUBLIC_SALLA_RENEWAL_URL when set", () => {
    const prev = process.env.NEXT_PUBLIC_SALLA_RENEWAL_URL;
    process.env.NEXT_PUBLIC_SALLA_RENEWAL_URL = "https://salla.example/checkout";
    try {
      expect(gatewayCtaHref("salla")).toBe("https://salla.example/checkout");
    } finally {
      if (prev !== undefined) process.env.NEXT_PUBLIC_SALLA_RENEWAL_URL = prev;
      else delete process.env.NEXT_PUBLIC_SALLA_RENEWAL_URL;
    }
  });
});

describe("isDismissedFrom", () => {
  function makeStorage(data: Record<string, string>): Pick<Storage, "getItem"> {
    return {
      getItem: (k: string) => (k in data ? data[k] : null),
    };
  }

  it("returns false when storage is null", () => {
    expect(isDismissedFrom(null)).toBe(false);
  });

  it("returns false when no dismiss keys present", () => {
    expect(isDismissedFrom(makeStorage({}))).toBe(false);
  });

  it("returns true when dismissed_until is in the future", () => {
    const now = 1_000_000;
    const storage = makeStorage({
      [DISMISS_KEY]: String(now + 60 * 60 * 1000), // +1h
    });
    expect(isDismissedFrom(storage, now)).toBe(true);
  });

  it("returns false when dismissed_until is in the past", () => {
    const now = 1_000_000;
    const storage = makeStorage({
      [DISMISS_KEY]: String(now - 60 * 60 * 1000), // -1h
    });
    expect(isDismissedFrom(storage, now)).toBe(false);
  });

  it("returns true when dismiss_count >= 3", () => {
    expect(isDismissedFrom(makeStorage({ [DISMISS_COUNT_KEY]: "3" }))).toBe(
      true
    );
  });

  it("returns true when dismiss_count > 3", () => {
    expect(isDismissedFrom(makeStorage({ [DISMISS_COUNT_KEY]: "7" }))).toBe(
      true
    );
  });

  it("returns false when dismiss_count < 3 and no future until", () => {
    expect(isDismissedFrom(makeStorage({ [DISMISS_COUNT_KEY]: "2" }))).toBe(
      false
    );
  });

  it("handles NaN getItem values gracefully", () => {
    expect(
      isDismissedFrom(
        makeStorage({
          [DISMISS_KEY]: "not-a-number",
          [DISMISS_COUNT_KEY]: "also-not",
        })
      )
    ).toBe(false);
  });

  it("handles storage.getItem throwing", () => {
    const throwingStorage: Pick<Storage, "getItem"> = {
      getItem: () => {
        throw new Error("storage blocked");
      },
    };
    expect(isDismissedFrom(throwingStorage)).toBe(false);
  });
});
