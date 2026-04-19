import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for referral credit helpers (Phase 10.06 / REFER-03/04/05/06/08).
 *
 * Behavior covered:
 *  - isInviteeEligible('day14_reached' | 'not_yet' | 'refunded')
 *      * refunded when invitee subscription_status='expired' BEFORE redeemed+14d
 *      * refunded when invitee expires_at < redeemed+14d
 *      * day14_reached when progress.completed_days includes 14
 *      * not_yet when max completed_day < 14
 *  - yearlyRewardedCount — filters by referrer_id + status='rewarded' + year-start
 *  - creditOneReferral orchestration:
 *      * happy path → 'credited' + expires_at extended by 30d from max(now, current)
 *      * already-expired referrer → newExpiresAt ≈ now + 30d
 *      * refunded invitee → 'refunded' + referrals.status='refunded' + NO profiles.update
 *      * at-cap referrer → 'capped' + referrals.status='void' + NO profiles.update
 *      * idempotency guard: row.status='rewarded' → 'invalid_row', zero writes
 *
 * Reference pattern: src/lib/renewal/shouldShow.test.ts — chained-thenable fake admin.
 */

type FakeResponse = { data: any; error: any };

interface TableState {
  selectResponses?: FakeResponse[]; // responses queue per table (FIFO)
  updateResponse?: FakeResponse;
  countResponse?: FakeResponse;
}

interface Responses {
  referrals?: TableState;
  profiles?: TableState;
  progress?: TableState;
  user_progress?: TableState;
}

interface Calls {
  profileUpdates: Array<{ id: string; expires_at: string }>;
  referralUpdates: Array<{ id: string; patch: Record<string, unknown> }>;
}

function buildFakeAdmin(responses: Responses) {
  const calls: Calls = { profileUpdates: [], referralUpdates: [] };
  // per-table select response queues
  const queues: Record<string, FakeResponse[]> = {};
  for (const t of Object.keys(responses) as (keyof Responses)[]) {
    queues[t] = [...(responses[t]?.selectResponses ?? [])];
  }

  function nextSelect(table: string): FakeResponse {
    const q = queues[table] ?? [];
    if (q.length > 0) return q.shift()!;
    return { data: null, error: null };
  }

  const admin = {
    from(table: string) {
      // filter/where chain state captured via closures (we don't assert on them here)
      const chain: any = {
        _table: table,
        _lastUpdate: null as Record<string, unknown> | null,
        _lastEqId: null as string | null,
        _headCount: false,
        select(_sel?: string, opts?: { count?: string; head?: boolean }) {
          if (opts?.head && opts?.count) {
            chain._headCount = true;
          }
          return chain;
        },
        eq(col: string, val: string) {
          if (col === "id") chain._lastEqId = val;
          return chain;
        },
        in(_col: string, _vals: unknown[]) {
          return chain;
        },
        gte() {
          return chain;
        },
        lte() {
          return chain;
        },
        lt() {
          return chain;
        },
        limit() {
          // terminal for count queries
          if (chain._headCount) {
            const resp = responses[table as keyof Responses]?.countResponse;
            return Promise.resolve(resp ?? { data: null, error: null, count: 0 });
          }
          return Promise.resolve(nextSelect(table));
        },
        maybeSingle() {
          return Promise.resolve(nextSelect(table));
        },
        single() {
          return Promise.resolve(nextSelect(table));
        },
        update(patch: Record<string, unknown>) {
          chain._lastUpdate = patch;
          // returns a new sub-chain whose .eq() resolves the write
          const updateChain: any = {
            eq(_col: string, val: string) {
              if (table === "profiles") {
                calls.profileUpdates.push({ id: val, expires_at: String(patch.expires_at ?? "") });
              } else if (table === "referrals") {
                calls.referralUpdates.push({ id: val, patch });
              }
              const resp = responses[table as keyof Responses]?.updateResponse;
              return Promise.resolve(resp ?? { data: null, error: null });
            },
          };
          return updateChain;
        },
        // make the chain itself thenable for count queries like
        // `const { count } = await admin.from(...).select(...,{count,head}).eq(...)`
        then(resolve: (v: FakeResponse) => void) {
          if (chain._headCount) {
            const resp = responses[table as keyof Responses]?.countResponse ?? {
              data: null,
              error: null,
              count: 0,
            };
            resolve(resp);
            return;
          }
          resolve(nextSelect(table));
        },
      };
      return chain;
    },
  };

  return { admin, calls };
}

import {
  isInviteeEligible,
  yearlyRewardedCount,
  creditOneReferral,
  type CreditOutcome,
} from "./credit";

const DAY = 24 * 60 * 60 * 1000;

describe("isInviteeEligible", () => {
  it("returns 'refunded' when invitee subscription_status='expired' before redeemed+14d", async () => {
    const redeemedAt = new Date(Date.now() - 10 * DAY).toISOString();
    const { admin } = buildFakeAdmin({
      profiles: {
        selectResponses: [
          {
            data: {
              subscription_status: "expired",
              expires_at: new Date(Date.now() - 1 * DAY).toISOString(),
            },
            error: null,
          },
        ],
      },
    });
    const r = await isInviteeEligible(admin as any, "invitee-1", redeemedAt);
    expect(r).toBe("refunded");
  });

  it("returns 'refunded' when invitee expires_at < redeemed + 14d", async () => {
    const redeemedAt = new Date(Date.now() - 20 * DAY).toISOString();
    const earlyExpiry = new Date(Date.parse(redeemedAt) + 10 * DAY).toISOString();
    const { admin } = buildFakeAdmin({
      profiles: {
        selectResponses: [
          {
            data: { subscription_status: "active", expires_at: earlyExpiry },
            error: null,
          },
        ],
      },
    });
    const r = await isInviteeEligible(admin as any, "invitee-1", redeemedAt);
    expect(r).toBe("refunded");
  });

  it("returns 'day14_reached' when progress.completed_days includes 14", async () => {
    const redeemedAt = new Date(Date.now() - 15 * DAY).toISOString();
    const lateExpiry = new Date(Date.parse(redeemedAt) + 30 * DAY).toISOString();
    const { admin } = buildFakeAdmin({
      profiles: {
        selectResponses: [
          {
            data: { subscription_status: "active", expires_at: lateExpiry },
            error: null,
          },
        ],
      },
      progress: {
        selectResponses: [
          { data: { completed_days: [1, 2, 3, 7, 10, 14] }, error: null },
        ],
      },
    });
    const r = await isInviteeEligible(admin as any, "invitee-1", redeemedAt);
    expect(r).toBe("day14_reached");
  });

  it("returns 'not_yet' when completed_days max is 10", async () => {
    const redeemedAt = new Date(Date.now() - 15 * DAY).toISOString();
    const lateExpiry = new Date(Date.parse(redeemedAt) + 30 * DAY).toISOString();
    const { admin } = buildFakeAdmin({
      profiles: {
        selectResponses: [
          {
            data: { subscription_status: "active", expires_at: lateExpiry },
            error: null,
          },
        ],
      },
      progress: {
        selectResponses: [{ data: { completed_days: [1, 5, 10] }, error: null }],
      },
    });
    const r = await isInviteeEligible(admin as any, "invitee-1", redeemedAt);
    expect(r).toBe("not_yet");
  });
});

describe("yearlyRewardedCount", () => {
  it("filters by referrer_id + status=rewarded + year-start; returns count", async () => {
    const now = new Date().toISOString();
    const { admin } = buildFakeAdmin({
      referrals: { countResponse: { data: null, error: null, count: 2 } as any },
    });
    const n = await yearlyRewardedCount(admin as any, "referrer-1", now);
    expect(n).toBe(2);
  });
});

describe("creditOneReferral", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("happy path: 'credited' + expires_at = max(now, current) + 30d", async () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const redeemedAt = new Date(now - 15 * DAY).toISOString();
    const currentExpires = new Date(now + 5 * DAY).toISOString(); // future
    const referrerExpires = new Date(now + 10 * DAY).toISOString();

    const { admin, calls } = buildFakeAdmin({
      profiles: {
        selectResponses: [
          // 1st read: invitee profile (for eligibility)
          {
            data: { subscription_status: "active", expires_at: currentExpires },
            error: null,
          },
          // 2nd read: referrer profile (for expires_at extension)
          { data: { expires_at: referrerExpires }, error: null },
        ],
        updateResponse: { data: null, error: null },
      },
      progress: {
        selectResponses: [{ data: { completed_days: [1, 7, 14] }, error: null }],
      },
      referrals: {
        countResponse: { data: null, error: null, count: 0 } as any,
        updateResponse: { data: null, error: null },
      },
    });

    const outcome = await creditOneReferral(admin as any, {
      id: "r-1",
      code: "FRIEND-ABC123",
      referrer_id: "referrer-1",
      invitee_id: "invitee-1",
      status: "pending_day14",
      invitee_redeemed_at: redeemedAt,
    });

    expect(outcome).toBe<CreditOutcome>("credited");
    expect(calls.profileUpdates).toHaveLength(1);
    const update = calls.profileUpdates[0];
    expect(update.id).toBe("referrer-1");
    // base = max(now, Date.parse(referrerExpires)); + 30d
    const expectedBase = Math.max(now, Date.parse(referrerExpires));
    const expectedIso = new Date(expectedBase + 30 * DAY).toISOString();
    expect(update.expires_at).toBe(expectedIso);

    expect(calls.referralUpdates).toHaveLength(1);
    expect(calls.referralUpdates[0].id).toBe("r-1");
    expect(calls.referralUpdates[0].patch.status).toBe("rewarded");
    expect(calls.referralUpdates[0].patch.referrer_rewarded_at).toBeTruthy();

    vi.useRealTimers();
  });

  it("already-expired referrer: newExpiresAt ≈ now + 30d (not currentExpires + 30d)", async () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const redeemedAt = new Date(now - 15 * DAY).toISOString();
    const inviteeExpires = new Date(now + 5 * DAY).toISOString();
    const referrerExpiresPast = new Date(now - 60 * DAY).toISOString();

    const { admin, calls } = buildFakeAdmin({
      profiles: {
        selectResponses: [
          { data: { subscription_status: "active", expires_at: inviteeExpires }, error: null },
          { data: { expires_at: referrerExpiresPast }, error: null },
        ],
        updateResponse: { data: null, error: null },
      },
      progress: {
        selectResponses: [{ data: { completed_days: [14, 15] }, error: null }],
      },
      referrals: {
        countResponse: { data: null, error: null, count: 0 } as any,
        updateResponse: { data: null, error: null },
      },
    });

    const outcome = await creditOneReferral(admin as any, {
      id: "r-2",
      code: "FRIEND-ZZZ999",
      referrer_id: "referrer-2",
      invitee_id: "invitee-2",
      status: "pending_day14",
      invitee_redeemed_at: redeemedAt,
    });

    expect(outcome).toBe<CreditOutcome>("credited");
    const update = calls.profileUpdates[0];
    // base = max(now, past); = now; + 30d
    expect(update.expires_at).toBe(new Date(now + 30 * DAY).toISOString());

    vi.useRealTimers();
  });

  it("refunded invitee: 'refunded' + referrals.status='refunded' + NO profiles.update", async () => {
    const redeemedAt = new Date(Date.now() - 15 * DAY).toISOString();
    const { admin, calls } = buildFakeAdmin({
      profiles: {
        selectResponses: [
          // invitee profile: expired
          { data: { subscription_status: "expired", expires_at: redeemedAt }, error: null },
        ],
        updateResponse: { data: null, error: null },
      },
      referrals: { updateResponse: { data: null, error: null } },
    });

    const outcome = await creditOneReferral(admin as any, {
      id: "r-3",
      code: "FRIEND-RRR000",
      referrer_id: "referrer-3",
      invitee_id: "invitee-3",
      status: "pending_day14",
      invitee_redeemed_at: redeemedAt,
    });

    expect(outcome).toBe<CreditOutcome>("refunded");
    expect(calls.profileUpdates).toHaveLength(0);
    expect(calls.referralUpdates).toHaveLength(1);
    expect(calls.referralUpdates[0].patch.status).toBe("refunded");
  });

  it("at-cap referrer (3 rewarded this year): 'capped' + referrals.status='void' + NO profiles.update", async () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const redeemedAt = new Date(now - 15 * DAY).toISOString();
    const inviteeExpires = new Date(now + 5 * DAY).toISOString();

    const { admin, calls } = buildFakeAdmin({
      profiles: {
        selectResponses: [
          { data: { subscription_status: "active", expires_at: inviteeExpires }, error: null },
        ],
        updateResponse: { data: null, error: null },
      },
      progress: {
        selectResponses: [{ data: { completed_days: [1, 7, 14] }, error: null }],
      },
      referrals: {
        countResponse: { data: null, error: null, count: 3 } as any,
        updateResponse: { data: null, error: null },
      },
    });

    const outcome = await creditOneReferral(admin as any, {
      id: "r-4",
      code: "FRIEND-CAP001",
      referrer_id: "referrer-cap",
      invitee_id: "invitee-cap",
      status: "pending_day14",
      invitee_redeemed_at: redeemedAt,
    });

    expect(outcome).toBe<CreditOutcome>("capped");
    expect(calls.profileUpdates).toHaveLength(0);
    expect(calls.referralUpdates).toHaveLength(1);
    expect(calls.referralUpdates[0].patch.status).toBe("void");

    vi.useRealTimers();
  });

  it("not-yet-day14: 'not_yet_day14' + no writes (row untouched, will retry next run)", async () => {
    const redeemedAt = new Date(Date.now() - 15 * DAY).toISOString();
    const inviteeExpires = new Date(Date.now() + 5 * DAY).toISOString();

    const { admin, calls } = buildFakeAdmin({
      profiles: {
        selectResponses: [
          { data: { subscription_status: "active", expires_at: inviteeExpires }, error: null },
        ],
      },
      progress: {
        selectResponses: [{ data: { completed_days: [1, 5, 10] }, error: null }],
      },
    });

    const outcome = await creditOneReferral(admin as any, {
      id: "r-5",
      code: "FRIEND-NOT777",
      referrer_id: "referrer-nyd",
      invitee_id: "invitee-nyd",
      status: "pending_day14",
      invitee_redeemed_at: redeemedAt,
    });

    expect(outcome).toBe<CreditOutcome>("not_yet_day14");
    expect(calls.profileUpdates).toHaveLength(0);
    expect(calls.referralUpdates).toHaveLength(0);
  });

  it("idempotency: row.status='rewarded' already → 'invalid_row' + zero writes", async () => {
    const { admin, calls } = buildFakeAdmin({});
    const outcome = await creditOneReferral(admin as any, {
      id: "r-6",
      code: "FRIEND-IDM111",
      referrer_id: "referrer-idm",
      invitee_id: "invitee-idm",
      status: "rewarded",
      invitee_redeemed_at: new Date(Date.now() - 30 * DAY).toISOString(),
    });
    expect(outcome).toBe<CreditOutcome>("invalid_row");
    expect(calls.profileUpdates).toHaveLength(0);
    expect(calls.referralUpdates).toHaveLength(0);
  });

  it("idempotency: row.status='void' already → 'invalid_row' + zero writes", async () => {
    const { admin, calls } = buildFakeAdmin({});
    const outcome = await creditOneReferral(admin as any, {
      id: "r-7",
      code: "FRIEND-IDM222",
      referrer_id: "referrer-idm2",
      invitee_id: "invitee-idm2",
      status: "void",
      invitee_redeemed_at: new Date(Date.now() - 30 * DAY).toISOString(),
    });
    expect(outcome).toBe<CreditOutcome>("invalid_row");
    expect(calls.profileUpdates).toHaveLength(0);
    expect(calls.referralUpdates).toHaveLength(0);
  });

  it("null invitee_id: 'invalid_row' (defensive guard; never happens post-redemption but defends)", async () => {
    const { admin, calls } = buildFakeAdmin({});
    const outcome = await creditOneReferral(admin as any, {
      id: "r-8",
      code: "FRIEND-NUL000",
      referrer_id: "referrer-nul",
      invitee_id: null,
      status: "pending_day14",
      invitee_redeemed_at: new Date(Date.now() - 30 * DAY).toISOString(),
    });
    expect(outcome).toBe<CreditOutcome>("invalid_row");
    expect(calls.profileUpdates).toHaveLength(0);
    expect(calls.referralUpdates).toHaveLength(0);
  });
});
