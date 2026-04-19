import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * FRIEND-XXXXXX referral code generator (Phase 10, REFER-01).
 *
 * Design:
 *  - Prefix `FRIEND-` is deliberately distinct from `TAAMUN-*` (entitlement
 *    codes) to avoid namespace collisions at /api/activate (PITFALL #22).
 *  - Body is 6 chars from a Crockford base32 alphabet with I / L / O / U
 *    removed (confusable with 1 / 0 / V when copied over WhatsApp).
 *  - 32^6 ≈ 1.07B combinations — ample headroom for v1.2 scale without
 *    inviting birthday collisions.
 *  - Entropy: Node crypto `randomBytes` (NFR-08 — never Math.random).
 *  - No new deps (NFR-08): relies on node:crypto + the already-installed
 *    @supabase/supabase-js type.
 *
 * Downstream consumers:
 *  - Plan 10.03: `src/app/api/referral/create/route.ts` imports
 *    `generateUniqueFriendCode` to mint codes bound to the signed-in user.
 *  - Plan 10.04: `src/app/api/activate/route.ts` imports
 *    `FRIEND_CODE_REGEX` to branch the activation flow between TAAMUN-*
 *    and FRIEND-* inputs.
 */

export const FRIEND_PREFIX = "FRIEND-" as const;

/**
 * Crockford base32 minus I, L, O, U.
 *
 * Length MUST be exactly 32 so `byte % 32` produces a uniform distribution
 * (256 is a multiple of 32 — zero modulo bias).
 */
const CROCKFORD_CHARS = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Regex used at activation time (Plan 10.04) to detect a FRIEND-* input.
 * Kept in sync with `CROCKFORD_CHARS` — if one changes the other MUST too.
 */
export const FRIEND_CODE_REGEX = /^FRIEND-[0-9A-HJKMNP-TV-Z]{6}$/;

const BODY_LENGTH = 6;

/**
 * Pure FRIEND-XXXXXX generator. Uses cryptographically strong randomness
 * (Node crypto). No I/O.
 */
export function generateFriendCode(): string {
  const bytes = randomBytes(BODY_LENGTH);
  let body = "";
  for (let i = 0; i < BODY_LENGTH; i++) {
    body += CROCKFORD_CHARS[bytes[i] % 32];
  }
  return `${FRIEND_PREFIX}${body}`;
}

/**
 * Collision-aware FRIEND-* generator. Queries `public.referrals.code` to
 * guarantee uniqueness across the table. Retries up to `maxRetries` times
 * before throwing.
 *
 * Callers must pass a service-role (admin) Supabase client because RLS on
 * the `referrals` table only exposes rows the caller owns — the uniqueness
 * check must be able to see every row.
 *
 * @throws Error("referral_code_collision_exhausted") when every attempt
 *   collided with an existing row. Callers should surface this as a 500 —
 *   it indicates either a pathological birthday event or a misconfigured
 *   cron that is churning codes.
 */
export async function generateUniqueFriendCode(
  admin: SupabaseClient,
  maxRetries = 5,
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const candidate = generateFriendCode();
    const { data } = await admin
      .from("referrals")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  throw new Error("referral_code_collision_exhausted");
}
