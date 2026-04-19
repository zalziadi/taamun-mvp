import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tests for POST /api/referral/create (Plan 10.03).
 *
 * Covers the 5 must_have truths from 10.03-PLAN.md:
 *   1. 401 when unauthenticated (requireUser !ok)
 *   2. Happy path — mint new FRIEND-* code, insert row, emit event, 200 { ok, code, reused:false }
 *   3. Reuse path — user already has a pending_invitee row → return that code, NO insert, NO event
 *   4. Annual cap hit — 3 rewarded referrals this calendar year → 429 with { error: "annual_cap_reached", max:3, current:3 }
 *   5. Privacy — emitEvent properties ONLY contain { referral_code_prefix: "FRIEND" } (no full code, no PII)
 *
 * Pattern mirrored from src/lib/renewal/shouldShow.test.ts:
 *  - vi.mock() of each dep
 *  - Chained-thenable fake admin client (no network)
 *  - Deterministic code via mocked generateUniqueFriendCode
 */

type FakeResponse = {
  data: unknown;
  error: { message: string } | null;
  count?: number | null;
};

type FakeResponsesByFilter = {
  /** Response for the reuse-lookup chain (.is("invitee_id", null).eq("status","pending_invitee").maybeSingle()) */
  reuseLookup?: FakeResponse;
  /** Response for the cap-check chain (.eq("status","rewarded").gte("created_at",...)) */
  capCheck?: FakeResponse;
  /** Response for the insert chain (.insert(...)) */
  insert?: FakeResponse;
};

let currentResponses: FakeResponsesByFilter;
let insertSpy: ReturnType<typeof vi.fn>;
let emitSpy: ReturnType<typeof vi.fn>;
let generateSpy: ReturnType<typeof vi.fn>;
let requireUserSpy: ReturnType<typeof vi.fn>;

/**
 * Build a chainable fake that routes each terminal call to the right response
 * based on which filter methods were invoked on the way in.
 *
 * The route uses two distinct SELECT chains:
 *   a) reuse lookup:  .from("referrals").select("code").eq("referrer_id",...).is("invitee_id", null).eq("status", "pending_invitee").order(...).limit(1).maybeSingle()
 *   b) cap check:     .from("referrals").select("id", {count,head:true}).eq("referrer_id",...).eq("status", "rewarded").gte("created_at", startOfYear)
 * And one insert:
 *   c) insert:        .from("referrals").insert({...})
 *
 * We distinguish (a) vs (b) by whether `.is()` was called in the chain (only (a) uses .is()).
 */
function buildFakeAdmin(responses: FakeResponsesByFilter) {
  return {
    from(_table: string) {
      const ctx = { sawIs: false, sawInsert: false } as { sawIs: boolean; sawInsert: boolean };
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        is: () => {
          ctx.sawIs = true;
          return chain;
        },
        gte: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: () => {
          // reuse lookup terminal
          const r = responses.reuseLookup ?? { data: null, error: null };
          return Promise.resolve(r);
        },
        // cap-check terminal: the route awaits the chain directly after `.gte()`.
        // Provide a thenable so `await chain` resolves.
        then: (resolve: (v: any) => any) => {
          if (ctx.sawInsert) {
            const r = responses.insert ?? { data: null, error: null };
            return Promise.resolve(r).then(resolve);
          }
          if (ctx.sawIs) {
            // Shouldn't happen — reuse lookup ends in maybeSingle(), not awaited directly.
            const r = responses.reuseLookup ?? { data: null, error: null };
            return Promise.resolve(r).then(resolve);
          }
          const r = responses.capCheck ?? { data: null, error: null, count: 0 };
          return Promise.resolve(r).then(resolve);
        },
        insert: (row: unknown) => {
          ctx.sawInsert = true;
          insertSpy(row);
          return chain;
        },
      };
      return chain;
    },
  };
}

vi.mock("@/lib/authz", () => ({
  requireUser: (...args: any[]) => requireUserSpy(...args),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseAdmin: () => buildFakeAdmin(currentResponses),
}));

vi.mock("@/lib/referral/generate", () => ({
  generateUniqueFriendCode: (...args: any[]) => generateSpy(...args),
  FRIEND_PREFIX: "FRIEND-",
  FRIEND_CODE_REGEX: /^FRIEND-[0-9A-HJKMNP-TV-Z]{6}$/,
}));

vi.mock("@/lib/analytics/server", () => ({
  emitEvent: (...args: any[]) => emitSpy(...args),
}));

import { POST } from "./route";

const USER_ID = "user-abc-123";
const DETERMINISTIC_CODE = "FRIEND-TESTAB";

describe("POST /api/referral/create", () => {
  beforeEach(() => {
    insertSpy = vi.fn();
    emitSpy = vi.fn().mockResolvedValue(undefined);
    generateSpy = vi.fn().mockResolvedValue(DETERMINISTIC_CODE);
    requireUserSpy = vi.fn();
    currentResponses = {};
  });

  it("1. returns 401 when unauthenticated and makes no DB/event calls", async () => {
    const unauthorizedResp = new Response(
      JSON.stringify({ ok: false, error: "unauthorized" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
    requireUserSpy.mockResolvedValue({ ok: false, response: unauthorizedResp });

    const res = await POST();
    expect(res.status).toBe(401);
    expect(insertSpy).not.toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("2. happy path — mints new code, inserts row, emits prefix-only event, 200 { ok, code, reused:false }", async () => {
    requireUserSpy.mockResolvedValue({ ok: true, user: { id: USER_ID } });
    currentResponses = {
      reuseLookup: { data: null, error: null },
      capCheck: { data: null, error: null, count: 0 },
      insert: { data: null, error: null },
    };

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, code: DETERMINISTIC_CODE, reused: false });

    expect(generateSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        code: DETERMINISTIC_CODE,
        referrer_id: USER_ID,
        status: "pending_invitee",
      }),
    );

    expect(emitSpy).toHaveBeenCalledTimes(1);
    const [event, distinctId] = emitSpy.mock.calls[0];
    expect(event).toEqual({
      name: "referral_code_generated",
      properties: { referral_code_prefix: "FRIEND" },
    });
    expect(distinctId).toBe(USER_ID);

    // Privacy: no full code, no PII keys in the event properties
    const propKeys = Object.keys(event.properties);
    expect(propKeys).toEqual(["referral_code_prefix"]);
    for (const k of propKeys) {
      expect(k).not.toMatch(/_email$/);
      expect(k).not.toMatch(/^referral_code:/);
    }
    // The full code must NEVER appear as a value in the event properties.
    for (const v of Object.values(event.properties) as string[]) {
      expect(v).not.toMatch(/^FRIEND-[0-9A-Z]{6}$/);
    }
  });

  it("3. reuse path — returns existing pending_invitee code, no insert, no event", async () => {
    requireUserSpy.mockResolvedValue({ ok: true, user: { id: USER_ID } });
    const existingCode = "FRIEND-OLD123";
    currentResponses = {
      reuseLookup: { data: { code: existingCode }, error: null },
    };

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, code: existingCode, reused: true });

    expect(generateSpy).not.toHaveBeenCalled();
    expect(insertSpy).not.toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it("4. annual cap hit — 3 rewarded this year → 429 { error:'annual_cap_reached', max:3, current:3 }, no insert, no event", async () => {
    requireUserSpy.mockResolvedValue({ ok: true, user: { id: USER_ID } });
    currentResponses = {
      reuseLookup: { data: null, error: null },
      capCheck: { data: null, error: null, count: 3 },
    };

    const res = await POST();
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({
      ok: false,
      error: "annual_cap_reached",
      max: 3,
      current: 3,
    });

    expect(generateSpy).not.toHaveBeenCalled();
    expect(insertSpy).not.toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it("5. privacy contract — event properties are exactly { referral_code_prefix: 'FRIEND' } and never contain the full code", async () => {
    requireUserSpy.mockResolvedValue({ ok: true, user: { id: USER_ID } });
    currentResponses = {
      reuseLookup: { data: null, error: null },
      capCheck: { data: null, error: null, count: 0 },
      insert: { data: null, error: null },
    };

    await POST();

    expect(emitSpy).toHaveBeenCalledTimes(1);
    const [event] = emitSpy.mock.calls[0];
    // The properties object is deep-equal to the literal whitelist — no extra keys.
    expect(event.properties).toEqual({ referral_code_prefix: "FRIEND" });
    // Absolutely no property value equals the full generated code.
    expect(JSON.stringify(event.properties)).not.toContain(DETERMINISTIC_CODE);
  });
});
