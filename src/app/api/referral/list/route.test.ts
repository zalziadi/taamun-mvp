import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tests for GET /api/referral/list (Plan 10.05).
 *
 * The 3 truths:
 *   1. 401 when unauthenticated — no DB calls made.
 *   2. Happy path — returns caller's rows, scoped by .eq("referrer_id", user.id),
 *      with the privacy-safe column whitelist (no invitee_id).
 *   3. DB error → 500 { ok:false, error:"server_error" }.
 */

type FakeResponse = {
  data: unknown;
  error: { message: string } | null;
};

let currentResponse: FakeResponse;
let selectSpy: ReturnType<typeof vi.fn>;
let eqSpy: ReturnType<typeof vi.fn>;
let requireUserSpy: ReturnType<typeof vi.fn>;

function buildFakeAdmin(response: () => FakeResponse) {
  return {
    from(_table: string) {
      const chain: any = {
        select: (cols: string) => {
          (selectSpy as any)(cols);
          return chain;
        },
        eq: (col: string, val: unknown) => {
          (eqSpy as any)(col, val);
          return chain;
        },
        order: (_col: string, _opts: unknown) => {
          // terminal — the route awaits this expression
          return Promise.resolve(response());
        },
      };
      return chain;
    },
  };
}

vi.mock("@/lib/authz", () => ({
  requireUser: (...args: any[]) => (requireUserSpy as any)(...args),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseAdmin: () => buildFakeAdmin(() => currentResponse),
}));

import { GET } from "./route";

const USER_ID = "user-xyz-789";

describe("GET /api/referral/list", () => {
  beforeEach(() => {
    selectSpy = vi.fn();
    eqSpy = vi.fn();
    requireUserSpy = vi.fn();
    currentResponse = { data: [], error: null };
  });

  it("1. returns 401 when unauthenticated and never touches the DB", async () => {
    const unauthorizedResp = new Response(
      JSON.stringify({ ok: false, error: "unauthorized" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
    requireUserSpy.mockResolvedValue({ ok: false, response: unauthorizedResp });

    const res = await GET();
    expect(res.status).toBe(401);
    expect(selectSpy).not.toHaveBeenCalled();
    expect(eqSpy).not.toHaveBeenCalled();
  });

  it("2. happy path — returns caller's rows scoped by referrer_id with column whitelist (no invitee_id)", async () => {
    requireUserSpy.mockResolvedValue({ ok: true, user: { id: USER_ID } });
    const rows = [
      {
        id: "r-1",
        code: "FRIEND-AAAAAA",
        status: "pending_invitee",
        invitee_redeemed_at: null,
        referrer_rewarded_at: null,
        created_at: "2026-04-20T00:00:00Z",
      },
      {
        id: "r-2",
        code: "FRIEND-BBBBBB",
        status: "rewarded",
        invitee_redeemed_at: "2026-03-01T00:00:00Z",
        referrer_rewarded_at: "2026-03-15T00:00:00Z",
        created_at: "2026-02-20T00:00:00Z",
      },
    ];
    currentResponse = { data: rows, error: null };

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, referrals: rows });

    // Privacy: the SELECT whitelist must not include invitee_id.
    expect(selectSpy).toHaveBeenCalledTimes(1);
    const selectArg = selectSpy.mock.calls[0][0] as string;
    expect(selectArg).not.toMatch(/invitee_id/);
    // Expected columns present
    for (const col of [
      "id",
      "code",
      "status",
      "invitee_redeemed_at",
      "referrer_rewarded_at",
      "created_at",
    ]) {
      expect(selectArg).toContain(col);
    }

    // Scope: must filter on referrer_id = auth user id.
    expect(eqSpy).toHaveBeenCalledWith("referrer_id", USER_ID);
  });

  it("3. DB error → 500 { ok:false, error:'server_error' }", async () => {
    requireUserSpy.mockResolvedValue({ ok: true, user: { id: USER_ID } });
    currentResponse = { data: null, error: { message: "boom" } };

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "server_error" });
  });
});
