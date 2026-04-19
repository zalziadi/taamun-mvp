import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tests for shouldShowRenewalBanner server helper.
 *
 * Covers the 9 branches in 09.05-PLAN.md <behavior>:
 *   1. no_profile
 *   2. no_expires_at
 *   3. not_within_window (14 days away)
 *   4. not_within_window (auto-renewed, 90 days away)
 *   5. already_expired
 *   6. no_gateway (7-day window, original_gateway=NULL)
 *   7. email_sent_today (email queued within 24h)
 *   8. push_sent_today (push last_sent_at within 24h)
 *   9. show=true (6 days, gateway=tap, no recent nudges)
 *
 * We mock @/lib/supabaseAdmin to return a chained-thenable fake that lets us
 * dictate the response per-table for each scenario.
 */

type FakeRow = Record<string, unknown> | null;
type FakeResponse = { data: FakeRow | FakeRow[] | null; error: { message: string } | null };

interface FakeAdmin {
  _responses: {
    profiles?: FakeResponse;
    email_queue?: FakeResponse;
    push_subscriptions?: FakeResponse;
  };
}

/**
 * Build a chainable mock that mimics the subset of supabase-js PostgrestBuilder
 * used by shouldShowRenewalBanner: .select().eq().in().gte().limit().maybeSingle()
 *
 * The terminal methods maybeSingle() / limit() resolve to the per-table response.
 */
function buildFakeAdmin(responses: FakeAdmin["_responses"]) {
  return {
    _responses: responses,
    from(table: "profiles" | "email_queue" | "push_subscriptions") {
      const resp: FakeResponse = responses[table] ?? { data: null, error: null };
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        gte: () => chain,
        limit: () => Promise.resolve(resp),
        maybeSingle: () => Promise.resolve(resp),
      };
      return chain;
    },
  };
}

vi.mock("@/lib/supabaseAdmin", () => {
  return {
    getSupabaseAdmin: () => currentAdmin,
  };
});

// mutable handle used by the mock above — each test sets it via setAdmin()
let currentAdmin: ReturnType<typeof buildFakeAdmin>;
function setAdmin(responses: FakeAdmin["_responses"]) {
  currentAdmin = buildFakeAdmin(responses);
}

// Import AFTER the mock is registered
import { shouldShowRenewalBanner } from "./shouldShow";

const DAY = 24 * 60 * 60 * 1000;

describe("shouldShowRenewalBanner", () => {
  beforeEach(() => {
    // default: empty email_queue + push_subscriptions (no nudges)
    setAdmin({
      email_queue: { data: [], error: null },
      push_subscriptions: { data: [], error: null },
    });
  });

  it("1. returns no_profile when profile row is missing", async () => {
    setAdmin({
      profiles: { data: null, error: null },
    });
    const r = await shouldShowRenewalBanner("user-1");
    expect(r).toEqual({ show: false, reason: "no_profile" });
  });

  it("2. returns no_expires_at when expires_at is NULL (grandfathered)", async () => {
    setAdmin({
      profiles: {
        data: { expires_at: null, original_gateway: "salla", subscription_tier: "monthly" },
        error: null,
      },
    });
    const r = await shouldShowRenewalBanner("user-1");
    expect(r).toEqual({ show: false, reason: "no_expires_at" });
  });

  it("3. returns not_within_window when expires_at is 14 days away", async () => {
    const expiresAt = new Date(Date.now() + 14 * DAY).toISOString();
    setAdmin({
      profiles: {
        data: { expires_at: expiresAt, original_gateway: "tap", subscription_tier: "monthly" },
        error: null,
      },
    });
    const r = await shouldShowRenewalBanner("user-1");
    expect(r).toEqual({ show: false, reason: "not_within_window" });
  });

  it("4. returns not_within_window when auto-renewed (90 days away)", async () => {
    const expiresAt = new Date(Date.now() + 90 * DAY).toISOString();
    setAdmin({
      profiles: {
        data: { expires_at: expiresAt, original_gateway: "stripe", subscription_tier: "quarterly" },
        error: null,
      },
    });
    const r = await shouldShowRenewalBanner("user-1");
    expect(r).toEqual({ show: false, reason: "not_within_window" });
  });

  it("5. returns already_expired when expires_at has passed", async () => {
    const expiresAt = new Date(Date.now() - 2 * DAY).toISOString();
    setAdmin({
      profiles: {
        data: { expires_at: expiresAt, original_gateway: "salla", subscription_tier: "monthly" },
        error: null,
      },
    });
    const r = await shouldShowRenewalBanner("user-1");
    expect(r).toEqual({ show: false, reason: "already_expired" });
  });

  it("6. returns no_gateway when original_gateway is NULL within the 7-day window", async () => {
    const expiresAt = new Date(Date.now() + 5 * DAY).toISOString();
    setAdmin({
      profiles: {
        data: { expires_at: expiresAt, original_gateway: null, subscription_tier: "monthly" },
        error: null,
      },
    });
    const r = await shouldShowRenewalBanner("user-1");
    expect(r).toEqual({ show: false, reason: "no_gateway" });
  });

  it("7. returns email_sent_today when an expiry_warning email was queued within 24h", async () => {
    const expiresAt = new Date(Date.now() + 6 * DAY).toISOString();
    setAdmin({
      profiles: {
        data: { expires_at: expiresAt, original_gateway: "salla", subscription_tier: "monthly" },
        error: null,
      },
      email_queue: {
        data: [{ id: "email-1" }],
        error: null,
      },
      push_subscriptions: { data: [], error: null },
    });
    const r = await shouldShowRenewalBanner("user-1");
    expect(r).toEqual({ show: false, reason: "email_sent_today" });
  });

  it("8. returns push_sent_today when push last_sent_at is within 24h", async () => {
    const expiresAt = new Date(Date.now() + 6 * DAY).toISOString();
    setAdmin({
      profiles: {
        data: { expires_at: expiresAt, original_gateway: "salla", subscription_tier: "monthly" },
        error: null,
      },
      email_queue: { data: [], error: null },
      push_subscriptions: {
        data: [{ last_sent_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() }],
        error: null,
      },
    });
    const r = await shouldShowRenewalBanner("user-1");
    expect(r).toEqual({ show: false, reason: "push_sent_today" });
  });

  it("9. returns show=true with gateway=tap when within window, no nudges today", async () => {
    const expiresAt = new Date(Date.now() + 6 * DAY).toISOString();
    setAdmin({
      profiles: {
        data: { expires_at: expiresAt, original_gateway: "tap", subscription_tier: "monthly" },
        error: null,
      },
      email_queue: { data: [], error: null },
      push_subscriptions: { data: [], error: null },
    });
    const r = await shouldShowRenewalBanner("user-1");
    expect(r).toMatchObject({
      show: true,
      gateway: "tap",
      tier: "monthly",
    });
    // daysRemaining should be ceil((6d) / 1d) = 6 (could be 6 or 7 depending on ms precision, so assert range)
    if (r.show) {
      expect(r.daysRemaining).toBeGreaterThanOrEqual(5);
      expect(r.daysRemaining).toBeLessThanOrEqual(7);
    }
  });
});
