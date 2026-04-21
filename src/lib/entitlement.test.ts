import { describe, it, expect } from "vitest";
import { makeEntitlementToken, verifyEntitlementToken } from "@/lib/entitlement";

describe("entitlement HMAC — pipe delimiter (v1.4 fix)", () => {
  it("round-trips a token with ISO-timestamp expiresAt (the bug case)", () => {
    process.env.ENTITLEMENT_SECRET = "test-secret-for-unit-tests-only";
    const expiresAt = "2099-12-31T23:59:59.999Z"; // far future — won't expire during test
    const token = makeEntitlementToken("user-uuid-123", "monthly", expiresAt);
    const result = verifyEntitlementToken(token);
    expect(result.valid).toBe(true);
    expect(result.userId).toBe("user-uuid-123");
    expect(result.tier).toBe("monthly");
    expect(result.expiresAt).toBe(expiresAt);
  });

  it("rejects old colon-delimited tokens as expired (backward compat)", () => {
    process.env.ENTITLEMENT_SECRET = "test-secret-for-unit-tests-only";
    // Simulate an old token format: userId:tier:timestamp:exp:signature
    const oldPayload = "user-uuid-456:yearly:1234567890:2026-12-31T00:00:00.000Z";
    const oldToken = Buffer.from(`${oldPayload}:fakesig`).toString("base64");
    const result = verifyEntitlementToken(oldToken);
    expect(result.valid).toBe(false);
    expect(result.expired).toBe(true);
  });

  it("rejects tampered tokens", () => {
    process.env.ENTITLEMENT_SECRET = "test-secret-for-unit-tests-only";
    const token = makeEntitlementToken("user-1", "monthly", "2026-12-31T00:00:00.000Z");
    const tampered = Buffer.from(
      Buffer.from(token, "base64").toString("utf-8").replace("user-1", "user-2")
    ).toString("base64");
    expect(verifyEntitlementToken(tampered).valid).toBe(false);
  });

  it("rejects expired tokens", () => {
    process.env.ENTITLEMENT_SECRET = "test-secret-for-unit-tests-only";
    const pastDate = "2020-01-01T00:00:00.000Z";
    const token = makeEntitlementToken("user-1", "monthly", pastDate);
    const result = verifyEntitlementToken(token);
    expect(result.valid).toBe(false);
    expect(result.expired).toBe(true);
    expect(result.userId).toBe("user-1");
  });
});
