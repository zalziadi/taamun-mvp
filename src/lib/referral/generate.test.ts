import { describe, it, expect, vi } from "vitest";
import {
  FRIEND_PREFIX,
  FRIEND_CODE_REGEX,
  generateFriendCode,
  generateUniqueFriendCode,
} from "./generate";

/**
 * Tests for FRIEND-XXXXXX referral code generator (Phase 10.02 / REFER-01).
 *
 * Covers behavior from 10.02-PLAN.md:
 *  - Prefix, regex shape, character-set purity (no I/L/O/U confusables).
 *  - TAAMUN-* namespace distinctness (PITFALL #22).
 *  - Collision retry via mocked Supabase admin.
 *  - Exhaustion throws referral_code_collision_exhausted.
 *
 * Pattern inspiration: src/lib/renewal/shouldShow.test.ts (co-located, vitest,
 * chained-thenable fake admin). No real network I/O.
 */

// -----------------------------------------------------------------------------
// Pure generator
// -----------------------------------------------------------------------------

describe("FRIEND_PREFIX", () => {
  it("equals 'FRIEND-'", () => {
    expect(FRIEND_PREFIX).toBe("FRIEND-");
  });
});

describe("FRIEND_CODE_REGEX", () => {
  it("rejects TAAMUN-* codes (namespace distinctness, PITFALL #22)", () => {
    expect(FRIEND_CODE_REGEX.test("TAAMUN-XYZ123")).toBe(false);
    expect(FRIEND_CODE_REGEX.test("TAAMUN-820-AB12")).toBe(false);
    // FRIEND-820-* is a reserved future TAAMUN subvariant space, not a referral code.
    expect(FRIEND_CODE_REGEX.test("FRIEND-820-AB12")).toBe(false);
  });

  it("rejects lowercase", () => {
    expect(FRIEND_CODE_REGEX.test("friend-ab23cd")).toBe(false);
    expect(FRIEND_CODE_REGEX.test("FRIEND-ab23cd")).toBe(false);
  });

  it("rejects confusable chars I, L, O, U even in well-shaped inputs", () => {
    expect(FRIEND_CODE_REGEX.test("FRIEND-IIIIII")).toBe(false);
    expect(FRIEND_CODE_REGEX.test("FRIEND-LLLLLL")).toBe(false);
    expect(FRIEND_CODE_REGEX.test("FRIEND-OOOOOO")).toBe(false);
    expect(FRIEND_CODE_REGEX.test("FRIEND-UUUUUU")).toBe(false);
  });

  it("rejects wrong body length", () => {
    expect(FRIEND_CODE_REGEX.test("FRIEND-ABC12")).toBe(false); // 5
    expect(FRIEND_CODE_REGEX.test("FRIEND-ABC1234")).toBe(false); // 7
  });

  it("accepts a valid hand-crafted sample", () => {
    expect(FRIEND_CODE_REGEX.test("FRIEND-ABC234")).toBe(true);
    expect(FRIEND_CODE_REGEX.test("FRIEND-ZYX987")).toBe(true);
  });
});

describe("generateFriendCode", () => {
  it("starts with FRIEND- prefix", () => {
    const code = generateFriendCode();
    expect(code.startsWith(FRIEND_PREFIX)).toBe(true);
  });

  it("has exact total length 13 (7 prefix + 6 body)", () => {
    expect(generateFriendCode()).toHaveLength(13);
  });

  it("matches FRIEND_CODE_REGEX across 1000 iterations", () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateFriendCode();
      expect(FRIEND_CODE_REGEX.test(code)).toBe(true);
    }
  });

  it("never emits confusable chars I, L, O, or U across 10k iterations", () => {
    const forbidden = ["I", "L", "O", "U"];
    for (let i = 0; i < 10_000; i++) {
      const code = generateFriendCode();
      const body = code.slice(FRIEND_PREFIX.length);
      for (const ch of forbidden) {
        expect(body.includes(ch)).toBe(false);
      }
    }
  });

  it("spans the full 32-char alphabet over 10k iterations (every allowed char appears >= 1 time)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      const body = generateFriendCode().slice(FRIEND_PREFIX.length);
      for (const ch of body) seen.add(ch);
    }
    const expected = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".split("");
    for (const ch of expected) {
      expect(seen.has(ch)).toBe(true);
    }
  });
});

// -----------------------------------------------------------------------------
// Collision-aware generator (Supabase-dependent)
// -----------------------------------------------------------------------------

/**
 * Builds a minimal chained-thenable fake Supabase admin whose
 * .from("referrals").select("id").eq("code", …).maybeSingle()
 * pipe resolves to the scripted responses in order.
 */
function makeFakeAdmin(responses: Array<{ data: unknown; error: unknown }>) {
  const maybeSingle = vi.fn();
  for (const r of responses) {
    maybeSingle.mockResolvedValueOnce(r);
  }
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle,
  };
  return chain;
}

describe("generateUniqueFriendCode", () => {
  it("returns a valid FRIEND code on first attempt when no collision", async () => {
    const admin = makeFakeAdmin([{ data: null, error: null }]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = await generateUniqueFriendCode(admin as any);
    expect(FRIEND_CODE_REGEX.test(code)).toBe(true);
    expect(admin.from).toHaveBeenCalledWith("referrals");
  });

  it("retries on collision and returns the first free code", async () => {
    const admin = makeFakeAdmin([
      { data: { id: "collide-1" }, error: null },
      { data: { id: "collide-2" }, error: null },
      { data: null, error: null },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = await generateUniqueFriendCode(admin as any);
    expect(FRIEND_CODE_REGEX.test(code)).toBe(true);
    expect(admin.maybeSingle).toHaveBeenCalledTimes(3);
  });

  it("throws referral_code_collision_exhausted after maxRetries", async () => {
    const admin = makeFakeAdmin([
      { data: { id: "c1" }, error: null },
      { data: { id: "c2" }, error: null },
      { data: { id: "c3" }, error: null },
    ]);
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generateUniqueFriendCode(admin as any, 3),
    ).rejects.toThrow("referral_code_collision_exhausted");
    expect(admin.maybeSingle).toHaveBeenCalledTimes(3);
  });
});
