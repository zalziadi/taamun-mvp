import { describe, it, expect, beforeEach, vi } from "vitest";
import type { YIRPublicStats } from "./types";

/**
 * Tests for getYearInReview (Phase 11.03, REQs YIR-01..06).
 *
 * Scenarios:
 *   A. Fresh cache (generated_at 1h ago) → return payload, RPC NOT called
 *   B. Stale cache (generated_at 25h ago) → RPC called, upsert fires
 *   C. No cache → RPC called, upsert fires
 *   D. Below 30-reflection threshold → returns null, no RPC, no upsert
 *   E. RPC error → returns null (never throws)
 *   F. Malformed RPC payload → returns null, no upsert
 *
 * Pattern inspiration: src/lib/renewal/shouldShow.test.ts — chained-thenable
 * fake Supabase client + vi.mock("@/lib/supabaseAdmin").
 */

// -----------------------------------------------------------------------------
// Fake Supabase admin — per-table chainable mock
// -----------------------------------------------------------------------------

type FakeResult = { data: unknown; error: unknown; count?: number };
type CountResult = { count: number | null; error: unknown };

interface FakeResponses {
  profiles?: FakeResult;
  reflections_count?: CountResult;
  year_reviews_select?: FakeResult;
  rpc?: FakeResult;
}

interface Spies {
  upsertCalled: boolean;
  upsertPayload?: unknown;
  rpcCalled: boolean;
  rpcArgs?: { name: string; args: unknown };
}

function buildFakeAdmin(resp: FakeResponses, spies: Spies) {
  // Universal chain that supports .select/.eq/.gte/.lt/.maybeSingle/.limit/.upsert.
  // Per-from() we hand back a terminal based on table identity.
  return {
    from(table: string) {
      if (table === "profiles") {
        const r = resp.profiles ?? { data: null, error: null };
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: () => Promise.resolve(r),
        };
        return chain;
      }
      if (table === "reflections") {
        const r = resp.reflections_count ?? { count: 0, error: null };
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          gte: () => chain,
          lt: () => chain,
          // Supabase supports awaiting the builder directly once .select(...,{count,head:true}) is chained.
          // Our helper uses: .from('reflections').select('id',{count:'exact',head:true}).eq.gte.lt
          // → terminal is the promise returned by the last chained call. We model it via `then`.
          then: (onFulfilled: any) => Promise.resolve(r).then(onFulfilled),
        };
        return chain;
      }
      if (table === "year_reviews") {
        const r = resp.year_reviews_select ?? { data: null, error: null };
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: () => Promise.resolve(r),
          upsert: (payload: unknown) => {
            spies.upsertCalled = true;
            spies.upsertPayload = payload;
            return Promise.resolve({ data: null, error: null });
          },
        };
        return chain;
      }
      // default: empty
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      };
      return chain;
    },
    rpc(name: string, args: unknown) {
      spies.rpcCalled = true;
      spies.rpcArgs = { name, args };
      const r = resp.rpc ?? { data: null, error: null };
      return Promise.resolve(r);
    },
  };
}

// ---- vi.mock MUST come before the import of aggregate.ts --------------------

let currentAdmin: ReturnType<typeof buildFakeAdmin>;
let currentSpies: Spies;

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseAdmin: () => currentAdmin,
}));

// Import AFTER mock registered
import { getYearInReview, MIN_REFLECTIONS_THRESHOLD, CACHE_TTL_HOURS } from "./aggregate";

function setAdmin(resp: FakeResponses): Spies {
  const spies: Spies = { upsertCalled: false, rpcCalled: false };
  currentAdmin = buildFakeAdmin(resp, spies);
  currentSpies = spies;
  return spies;
}

// -----------------------------------------------------------------------------

const HOUR = 60 * 60 * 1000;

const VALID_PAYLOAD: YIRPublicStats = {
  reflections_count: 120,
  awareness_avg: 0.73,
  milestones_reached: ["first_reflection", "week_one"],
  cycle_count: 2,
  earliest_reflection_at: "2026-04-01T00:00:00Z",
  latest_reflection_at: "2027-03-15T00:00:00Z",
  awareness_trajectory: [0.4, 0.5, 0.7, 0.8],
};

const PROFILE_2026_03_01 = {
  activation_started_at: "2026-03-01T10:00:00Z",
  created_at: "2026-01-15T00:00:00Z",
};

describe("getYearInReview — constants", () => {
  it("exposes MIN_REFLECTIONS_THRESHOLD = 30", () => {
    expect(MIN_REFLECTIONS_THRESHOLD).toBe(30);
  });
  it("exposes CACHE_TTL_HOURS = 24", () => {
    expect(CACHE_TTL_HOURS).toBe(24);
  });
});

describe("getYearInReview — scenarios", () => {
  const NOW = new Date("2027-04-20T12:00:00Z");

  beforeEach(() => {
    setAdmin({});
  });

  it("A. fresh cache (1h old) returns payload without calling RPC", async () => {
    const spies = setAdmin({
      profiles: { data: PROFILE_2026_03_01, error: null },
      reflections_count: { count: 120, error: null },
      year_reviews_select: {
        data: {
          payload: VALID_PAYLOAD,
          generated_at: new Date(NOW.getTime() - 1 * HOUR).toISOString(),
        },
        error: null,
      },
    });

    const result = await getYearInReview("user-a", undefined, () => NOW);
    expect(result).toEqual(VALID_PAYLOAD);
    expect(spies.rpcCalled).toBe(false);
    expect(spies.upsertCalled).toBe(false);
  });

  it("B. stale cache (25h old) regenerates via RPC + upserts fresh payload", async () => {
    const spies = setAdmin({
      profiles: { data: PROFILE_2026_03_01, error: null },
      reflections_count: { count: 120, error: null },
      year_reviews_select: {
        data: {
          payload: { ...VALID_PAYLOAD, reflections_count: 50 }, // stale copy
          generated_at: new Date(NOW.getTime() - 25 * HOUR).toISOString(),
        },
        error: null,
      },
      rpc: { data: VALID_PAYLOAD, error: null },
    });

    const result = await getYearInReview("user-b", undefined, () => NOW);
    expect(result).toEqual(VALID_PAYLOAD);
    expect(spies.rpcCalled).toBe(true);
    expect(spies.upsertCalled).toBe(true);
    expect(spies.rpcArgs?.name).toBe("get_year_in_review");
    expect(spies.rpcArgs?.args).toMatchObject({
      p_user_id: "user-b",
      p_year_key: "2027_anniversary",
    });
  });

  it("C. no cache row → RPC called, upsert fires", async () => {
    const spies = setAdmin({
      profiles: { data: PROFILE_2026_03_01, error: null },
      reflections_count: { count: 45, error: null },
      year_reviews_select: { data: null, error: null },
      rpc: { data: VALID_PAYLOAD, error: null },
    });

    const result = await getYearInReview("user-c", undefined, () => NOW);
    expect(result).toEqual(VALID_PAYLOAD);
    expect(spies.rpcCalled).toBe(true);
    expect(spies.upsertCalled).toBe(true);
  });

  it("D. below 30-reflection threshold → returns null, no RPC, no upsert", async () => {
    const spies = setAdmin({
      profiles: { data: PROFILE_2026_03_01, error: null },
      reflections_count: { count: 29, error: null },
    });

    const result = await getYearInReview("user-d", undefined, () => NOW);
    expect(result).toBeNull();
    expect(spies.rpcCalled).toBe(false);
    expect(spies.upsertCalled).toBe(false);
  });

  it("E. RPC error → returns null, never throws", async () => {
    const spies = setAdmin({
      profiles: { data: PROFILE_2026_03_01, error: null },
      reflections_count: { count: 100, error: null },
      year_reviews_select: { data: null, error: null },
      rpc: { data: null, error: { message: "RPC exploded" } },
    });

    const result = await getYearInReview("user-e", undefined, () => NOW);
    expect(result).toBeNull();
    expect(spies.upsertCalled).toBe(false);
  });

  it("F. malformed RPC payload (missing required keys) → returns null, no upsert", async () => {
    const spies = setAdmin({
      profiles: { data: PROFILE_2026_03_01, error: null },
      reflections_count: { count: 100, error: null },
      year_reviews_select: { data: null, error: null },
      rpc: { data: { foo: "bar" }, error: null },
    });

    const result = await getYearInReview("user-f", undefined, () => NOW);
    expect(result).toBeNull();
    expect(spies.upsertCalled).toBe(false);
  });

  it("G. missing profile → returns null, no RPC", async () => {
    const spies = setAdmin({
      profiles: { data: null, error: null },
    });
    const result = await getYearInReview("user-g", undefined, () => NOW);
    expect(result).toBeNull();
    expect(spies.rpcCalled).toBe(false);
  });
});
