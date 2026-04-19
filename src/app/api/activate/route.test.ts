import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tests for POST /api/activate — Phase 10.04 (FRIEND-* referral redemption).
 *
 * Scope:
 *  - TAAMUN-* regression guards (CLAUDE.md rule S1): the existing
 *    activation_codes path must remain byte-identical in behavior. We assert
 *    the legacy happy path + the "used code" 409 so any accidental reorder of
 *    the new branch can't silently break Phase 9 deployments.
 *  - FRIEND-* branch:
 *      • 404 code_not_found when the referrals row is missing.
 *      • 409 code_already_redeemed when `invitee_id` is populated.
 *      • 409 self_referral_forbidden when referrer_id === auth.user.id
 *        (REFER-07 app-layer defense; DB CHECK is the backstop).
 *      • Happy path: tier='monthly', expires_at ~ now+30d, profiles upsert,
 *        referrals update (status='pending_day14', invitee_id set,
 *        invitee_redeemed_at ISO), emitEvent called with prefix-only props,
 *        cookie set with COOKIE_NAME.
 *  - Transport guards:
 *      • Anonymous → 401 (unchanged from requireUser).
 *      • Malformed body → 400 invalid_body.
 *
 * Mocking shape: we mock `@/lib/authz` → requireUser and
 * `@/lib/supabaseAdmin` → getSupabaseAdmin. The admin mock records `.from()`
 * table names so we can dispatch `activation_codes` vs `referrals` responses
 * and capture the args to `.upsert()` / `.update()`.
 *
 * We deliberately do NOT mock calcExpiresAt or makeEntitlementToken — those
 * are already unit-tested elsewhere; mocking them would paper over an
 * integration breakage. ENTITLEMENT_SECRET is set at module top so the real
 * entitlement module can run.
 */

process.env.ENTITLEMENT_SECRET = "test-secret-for-vitest-only";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

type UserShape = { id: string; email: string };

interface AuthState {
  ok: boolean;
  user?: UserShape;
}

interface FakeResponse<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

interface TableResponses {
  activation_codes_select?: FakeResponse;
  activation_codes_update?: FakeResponse;
  referrals_select?: FakeResponse;
  referrals_update?: FakeResponse;
  profiles_upsert?: FakeResponse;
  profiles_update?: FakeResponse;
}

interface Captured {
  upsertArgs?: Record<string, unknown>;
  updateArgs?: Record<string, unknown>;
  referralUpdateArgs?: Record<string, unknown>;
  activationUpdateArgs?: Record<string, unknown>;
  profileUpdateArgs?: Record<string, unknown>;
}

let authState: AuthState;
let tableResponses: TableResponses;
let captured: Captured;
let emitEventCalls: Array<{ event: { name: string; properties: Record<string, unknown> }; distinctId: string }>;

// ---------------------------------------------------------------------------
// Mocks — declared before imports so vi.mock hoists properly
// ---------------------------------------------------------------------------

vi.mock("@/lib/authz", () => ({
  requireUser: async () => {
    if (!authState.ok) {
      const { NextResponse } = await import("next/server");
      return {
        ok: false as const,
        response: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }),
      };
    }
    return { ok: true as const, user: authState.user!, supabase: {} };
  },
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseAdmin: () => buildFakeAdmin(),
}));

vi.mock("@/lib/analytics/server", () => ({
  emitEvent: async (
    event: { name: string; properties: Record<string, unknown> },
    distinctId: string
  ) => {
    emitEventCalls.push({ event, distinctId });
  },
}));

// Pass-through mocks for the remaining `@/` aliased deps. We deliberately do
// NOT fake these — we forward to the real modules so integration behavior is
// exercised (calcExpiresAt math, makeEntitlementToken HMAC, cookie maxAge).
// The only reason these are mocked at all is that vitest's default resolver
// doesn't understand the `@/*` tsconfig path alias; `vi.mock(path, factory)`
// intercepts the alias before Node's resolver sees it.
vi.mock("@/lib/entitlement", async () => {
  return await import("../../../lib/entitlement");
});
vi.mock("@/lib/subscriptionDurations", async () => {
  return await import("../../../lib/subscriptionDurations");
});

function buildFakeAdmin() {
  return {
    from(table: string) {
      // activation_codes table
      if (table === "activation_codes") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve(
                  tableResponses.activation_codes_select ?? { data: null, error: null }
                ),
            }),
          }),
          update: (args: Record<string, unknown>) => {
            captured.activationUpdateArgs = args;
            return {
              eq: () =>
                Promise.resolve(
                  tableResponses.activation_codes_update ?? { data: null, error: null }
                ),
            };
          },
        };
      }

      // referrals table
      if (table === "referrals") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve(
                  tableResponses.referrals_select ?? { data: null, error: null }
                ),
            }),
          }),
          update: (args: Record<string, unknown>) => {
            captured.referralUpdateArgs = args;
            return {
              eq: () =>
                Promise.resolve(
                  tableResponses.referrals_update ?? { data: null, error: null }
                ),
            };
          },
        };
      }

      // profiles table — supports both upsert (new subscription) and update
      // (original_gateway tag). Returns a chain that tracks the shape we use.
      if (table === "profiles") {
        return {
          upsert: (args: Record<string, unknown>) => {
            captured.upsertArgs = args;
            return Promise.resolve(
              tableResponses.profiles_upsert ?? { data: null, error: null }
            );
          },
          update: (args: Record<string, unknown>) => {
            captured.profileUpdateArgs = args;
            return {
              eq: () => ({
                is: () =>
                  Promise.resolve(
                    tableResponses.profiles_update ?? { data: null, error: null }
                  ),
              }),
            };
          },
        };
      }

      throw new Error(`unexpected table in fake admin: ${table}`);
    },
  };
}

// ---------------------------------------------------------------------------
// Import target AFTER mocks
// ---------------------------------------------------------------------------

import { POST } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReq(body: unknown): Request {
  return new Request("http://localhost/api/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? "not-json" : JSON.stringify(body),
  });
}

function resetState() {
  authState = {
    ok: true,
    user: { id: "user-invitee-uuid", email: "invitee@example.com" },
  };
  tableResponses = {};
  captured = {};
  emitEventCalls = [];
}

// ---------------------------------------------------------------------------
// TAAMUN-* regression (existing Phase 9 behavior must NOT change)
// ---------------------------------------------------------------------------

describe("POST /api/activate — TAAMUN-* regression", () => {
  beforeEach(resetState);

  it("happy path: TAAMUN-XXX code activates and writes activation_codes.used_by", async () => {
    tableResponses.activation_codes_select = {
      data: {
        id: "code-row-id",
        code: "TAAMUN-ABC123",
        tier: "monthly",
        used_by: null,
      },
      error: null,
    };
    tableResponses.activation_codes_update = { data: null, error: null };
    tableResponses.profiles_upsert = { data: null, error: null };
    tableResponses.profiles_update = { data: null, error: null };

    const res = await POST(buildReq({ code: "TAAMUN-ABC123" }) as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ ok: true, tier: "monthly" });
    // Activation path MUST hit activation_codes.update with used_by
    expect(captured.activationUpdateArgs).toMatchObject({ used_by: "user-invitee-uuid" });
    // Must NOT touch referrals in TAAMUN-* path
    expect(captured.referralUpdateArgs).toBeUndefined();
    // Must NOT emit referral_code_redeemed
    expect(emitEventCalls.find((c) => c.event.name === "referral_code_redeemed")).toBeUndefined();
  });

  it("409 when TAAMUN-XXX code already used", async () => {
    tableResponses.activation_codes_select = {
      data: {
        id: "code-row-id",
        code: "TAAMUN-ABC123",
        tier: "monthly",
        used_by: "someone-else",
      },
      error: null,
    };

    const res = await POST(buildReq({ code: "TAAMUN-ABC123" }) as never);
    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// FRIEND-* branch
// ---------------------------------------------------------------------------

describe("POST /api/activate — FRIEND-* branch", () => {
  beforeEach(resetState);

  it("404 code_not_found when referrals row is missing", async () => {
    tableResponses.referrals_select = { data: null, error: null };

    const res = await POST(buildReq({ code: "FRIEND-ABCDE2" }) as never);
    expect(res.status).toBe(404);
    // Must not have written profiles or referrals
    expect(captured.upsertArgs).toBeUndefined();
    expect(captured.referralUpdateArgs).toBeUndefined();
  });

  it("409 code_already_redeemed when invitee_id is populated", async () => {
    tableResponses.referrals_select = {
      data: {
        id: "referral-row-id",
        referrer_id: "some-referrer",
        invitee_id: "already-used",
        status: "pending_day14",
      },
      error: null,
    };

    const res = await POST(buildReq({ code: "FRIEND-ABCDE2" }) as never);
    expect(res.status).toBe(409);
    expect(captured.upsertArgs).toBeUndefined();
    expect(captured.referralUpdateArgs).toBeUndefined();
  });

  it("409 self_referral_forbidden when referrer_id === auth.user.id", async () => {
    tableResponses.referrals_select = {
      data: {
        id: "referral-row-id",
        referrer_id: "user-invitee-uuid", // SAME as auth user → self-referral
        invitee_id: null,
        status: "pending_invitee",
      },
      error: null,
    };

    const res = await POST(buildReq({ code: "FRIEND-ABCDE2" }) as never);
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error).toBe("self_referral_forbidden");
    expect(captured.upsertArgs).toBeUndefined();
    expect(captured.referralUpdateArgs).toBeUndefined();
  });

  it("happy path: invitee gets free month, referrals set to pending_day14, event emitted prefix-only", async () => {
    tableResponses.referrals_select = {
      data: {
        id: "referral-row-id",
        referrer_id: "user-referrer-uuid",
        invitee_id: null,
        status: "pending_invitee",
      },
      error: null,
    };
    tableResponses.profiles_upsert = { data: null, error: null };
    tableResponses.profiles_update = { data: null, error: null };
    tableResponses.referrals_update = { data: null, error: null };

    const before = Date.now();
    const res = await POST(buildReq({ code: "FRIEND-ABCDE2" }) as never);
    const after = Date.now();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      tier: "monthly",
      via: "friend_referral",
    });
    expect(typeof json.expires_at).toBe("string");

    // profiles upsert — tier=monthly, expires_at ~ now+30d (±2 min tolerance for slow CI)
    expect(captured.upsertArgs).toMatchObject({
      id: "user-invitee-uuid",
      subscription_status: "active",
      subscription_tier: "monthly",
    });
    const expiresMs = new Date(captured.upsertArgs!.expires_at as string).getTime();
    const targetMin = before + 30 * 24 * 60 * 60 * 1000 - 120_000;
    const targetMax = after + 30 * 24 * 60 * 60 * 1000 + 120_000;
    expect(expiresMs).toBeGreaterThanOrEqual(targetMin);
    expect(expiresMs).toBeLessThanOrEqual(targetMax);

    // referrals update — pending_day14 + invitee_id + invitee_redeemed_at
    expect(captured.referralUpdateArgs).toMatchObject({
      invitee_id: "user-invitee-uuid",
      status: "pending_day14",
    });
    expect(typeof captured.referralUpdateArgs!.invitee_redeemed_at).toBe("string");

    // Analytics event — prefix-only, never the full code
    const redeemCall = emitEventCalls.find((c) => c.event.name === "referral_code_redeemed");
    expect(redeemCall).toBeDefined();
    expect(redeemCall!.event.properties).toEqual({ referral_code_prefix: "FRIEND" });
    expect(redeemCall!.distinctId).toBe("user-invitee-uuid");

    // Cookie set with COOKIE_NAME
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("taamun_entitled=");
  });
});

// ---------------------------------------------------------------------------
// Transport / auth guards (unchanged from existing behavior)
// ---------------------------------------------------------------------------

describe("POST /api/activate — transport guards", () => {
  beforeEach(resetState);

  it("401 when not authenticated", async () => {
    authState = { ok: false };
    const res = await POST(buildReq({ code: "FRIEND-ABCDE2" }) as never);
    expect(res.status).toBe(401);
  });

  it("400 invalid_body when JSON parse fails", async () => {
    const res = await POST(buildReq(undefined) as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_body");
  });
});
