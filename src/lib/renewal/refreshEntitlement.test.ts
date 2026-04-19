/**
 * RENEW-09 — refreshEntitlementIfStale
 *
 * Unit tests for cookie-vs-DB reconciliation helper.
 * Uses lightweight fakes shaped like NextRequest/NextResponse.cookies — real
 * NextRequest/NextResponse constructors are not directly instantiable inside
 * vitest without the next/server runtime.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest, NextResponse } from "next/server";

// Ensure ENTITLEMENT_SECRET is present BEFORE importing modules that read it.
process.env.ENTITLEMENT_SECRET =
  process.env.ENTITLEMENT_SECRET || "test-secret-refresh-entitlement";

// Mock the supabase admin module so we can control what profiles.select returns.
vi.mock("../supabaseAdmin", () => {
  return {
    getSupabaseAdmin: vi.fn(),
  };
});

import { getSupabaseAdmin } from "../supabaseAdmin";
import { makeEntitlementToken, COOKIE_NAME } from "../entitlement";
import { refreshEntitlementIfStale } from "./refreshEntitlement";

type CookieFake = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

function fakeReq(cookieValue: string | undefined): NextRequest {
  const get = vi.fn((name: string) => {
    if (name === COOKIE_NAME && cookieValue !== undefined) {
      return { name, value: cookieValue };
    }
    return undefined;
  });
  return { cookies: { get } } as unknown as NextRequest;
}

function fakeRes(): { res: NextResponse; cookies: CookieFake } {
  const cookies: CookieFake = {
    get: vi.fn(),
    set: vi.fn(),
  };
  const res = { cookies } as unknown as NextResponse;
  return { res, cookies };
}

/**
 * Build a fake supabase admin that resolves a single-row `profiles` select
 * to the supplied row (or error).
 */
function mockAdminReturning(opts: {
  row?: { expires_at: string | null; subscription_tier?: string | null } | null;
  error?: unknown;
  throws?: Error;
}) {
  const maybeSingle = vi.fn(async () => {
    if (opts.throws) throw opts.throws;
    return { data: opts.row ?? null, error: opts.error ?? null };
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  (getSupabaseAdmin as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    from,
  });
  return { from, select, eq, maybeSingle };
}

const USER_ID = "user-abc-123";

describe("refreshEntitlementIfStale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("Test 1: DB expiry later than cookie expiry → sets refreshed cookie", async () => {
    // NOTE: `src/lib/entitlement.ts` splits base64-decoded tokens on ":", which
    // breaks when expiresAt is a full ISO timestamp (contains colons). That is a
    // pre-existing bug outside the scope of Plan 09.06 (see 09.06-SUMMARY.md
    // "Deferred Issues"). We use a colon-free expiry format (yyyy-mm-dd) in
    // tests so the token round-trips and exercises the happy path.
    const nowMs = Date.now();
    const cookieExpiry = new Date(nowMs + 2 * 86400000)
      .toISOString()
      .slice(0, 10); // "YYYY-MM-DD" — no colons
    const dbExpiry = new Date(nowMs + 30 * 86400000)
      .toISOString()
      .slice(0, 10);

    const staleCookie = makeEntitlementToken(USER_ID, "monthly", cookieExpiry);
    const req = fakeReq(staleCookie);
    const { res, cookies } = fakeRes();

    const harness = mockAdminReturning({
      row: { expires_at: dbExpiry, subscription_tier: "yearly" },
    });

    await refreshEntitlementIfStale(req, res, USER_ID);

    expect(harness.from).toHaveBeenCalledWith("profiles");
    expect(cookies.set).toHaveBeenCalledTimes(1);
    const [nameArg, valueArg, optsArg] = cookies.set.mock.calls[0];
    expect(nameArg).toBe(COOKIE_NAME);
    expect(typeof valueArg).toBe("string");
    expect(valueArg).not.toBe(staleCookie); // fresh token differs
    expect(optsArg).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    expect(typeof optsArg.maxAge).toBe("number");
    expect(optsArg.maxAge).toBeGreaterThan(0);
  });

  it("Test 2: DB expiry older than cookie expiry → does NOT set cookie", async () => {
    // Colon-free expiry (see Test 1 note re: pre-existing entitlement.ts bug).
    const nowMs = Date.now();
    const cookieExpiry = new Date(nowMs + 10 * 86400000)
      .toISOString()
      .slice(0, 10);
    const dbExpiry = new Date(nowMs + 5 * 86400000).toISOString().slice(0, 10);

    const freshCookie = makeEntitlementToken(USER_ID, "monthly", cookieExpiry);
    const req = fakeReq(freshCookie);
    const { res, cookies } = fakeRes();

    mockAdminReturning({
      row: { expires_at: dbExpiry, subscription_tier: "monthly" },
    });

    await refreshEntitlementIfStale(req, res, USER_ID);

    expect(cookies.set).not.toHaveBeenCalled();
  });

  it("Test 3: no cookie on request → does NOT set cookie and does NOT query DB", async () => {
    const req = fakeReq(undefined);
    const { res, cookies } = fakeRes();

    const harness = mockAdminReturning({
      row: {
        expires_at: new Date(Date.now() + 90 * 86400000).toISOString(),
        subscription_tier: "quarterly",
      },
    });

    await refreshEntitlementIfStale(req, res, USER_ID);

    expect(cookies.set).not.toHaveBeenCalled();
    expect(harness.from).not.toHaveBeenCalled(); // short-circuit before DB
  });

  it("Test 4: forged/invalid cookie → verifyEntitlementToken fails → no refresh", async () => {
    const req = fakeReq("this-is-not-a-valid-base64-hmac-token");
    const { res, cookies } = fakeRes();

    const harness = mockAdminReturning({
      row: {
        expires_at: new Date(Date.now() + 90 * 86400000).toISOString(),
        subscription_tier: "quarterly",
      },
    });

    await refreshEntitlementIfStale(req, res, USER_ID);

    expect(cookies.set).not.toHaveBeenCalled();
    expect(harness.from).not.toHaveBeenCalled();
  });

  it("Test 5: supabase throws → no cookie set and no exception propagates", async () => {
    // Colon-free expiry (see Test 1 note re: pre-existing entitlement.ts bug).
    const nowMs = Date.now();
    const cookieExpiry = new Date(nowMs + 2 * 86400000)
      .toISOString()
      .slice(0, 10);
    const staleCookie = makeEntitlementToken(USER_ID, "monthly", cookieExpiry);
    // Silence the expected [refreshEntitlementIfStale] warn emitted by catch.
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const req = fakeReq(staleCookie);
    const { res, cookies } = fakeRes();

    mockAdminReturning({ throws: new Error("supabase offline") });

    await expect(
      refreshEntitlementIfStale(req, res, USER_ID)
    ).resolves.toBeUndefined();
    expect(cookies.set).not.toHaveBeenCalled();
  });
});
