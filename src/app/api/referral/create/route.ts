import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateUniqueFriendCode } from "@/lib/referral/generate";
import { emitEvent } from "@/lib/analytics/server";

/**
 * POST /api/referral/create — mint (or re-surface) a FRIEND-* referral code
 * for the signed-in user.
 *
 * Plan 10.03 (REFER-01 / REFER-06 / REFER-12).
 *
 * Flow:
 *   1. requireUser()           → 401 unauthorized if no session.
 *   2. Reuse-lookup            → if the user already has an unredeemed
 *                                pending_invitee row, return that code with
 *                                `reused: true`. No insert, no event.
 *                                (REFER-12 / PITFALL #19 — avoid code sprawl.)
 *   3. Annual-cap check        → count `status='rewarded'` rows for this
 *                                referrer in the current calendar year. If
 *                                ≥ 3 → 429 `annual_cap_reached`. (REFER-06.)
 *   4. generateUniqueFriendCode→ service-role-backed uniqueness check across
 *                                `public.referrals.code` with retry.
 *   5. INSERT                  → row with status='pending_invitee'. Service
 *                                role bypasses RLS (no INSERT policy exists).
 *   6. emitEvent               → `referral_code_generated` with PREFIX-ONLY
 *                                props (`{referral_code_prefix: "FRIEND"}`).
 *                                ANALYTICS-07: the full code is never sent.
 *
 * Response contract:
 *   200 { ok: true,  code: "FRIEND-XXXXXX", reused: boolean }
 *   401 { ok: false, error: "unauthorized" }                    (via requireUser)
 *   429 { ok: false, error: "annual_cap_reached", max, current }
 *   500 { ok: false, error: "server_misconfig" | "server_error" }
 *
 * Runtime: Node.js (the route reads env for service-role key and calls
 * crypto.randomBytes inside generateUniqueFriendCode — Edge-incompatible).
 * Dynamic: force-dynamic because the response depends on the auth cookie
 * and live DB state; no caching.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** REFER-06: max 3 SUCCESSFUL (rewarded) referrals per referrer per calendar year. */
const ANNUAL_CAP = 3;

export async function POST() {
  // 1. Auth gate — REFER-12.
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  // Service-role client — bypasses RLS (the referrals table has SELECT-only
  // policies and relies on service role for every write).
  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, error: "server_misconfig" },
      { status: 500 },
    );
  }

  // 2. Reuse existing unredeemed code if present (idempotency / REFER-12).
  //    A pending_invitee row is one that was minted but not yet redeemed.
  const { data: existing } = await admin
    .from("referrals")
    .select("code")
    .eq("referrer_id", auth.user.id)
    .is("invitee_id", null)
    .eq("status", "pending_invitee")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.code) {
    return NextResponse.json({
      ok: true,
      code: existing.code,
      reused: true,
    });
  }

  // 3. Annual cap check — count status='rewarded' rows for THIS referrer in
  //    the current calendar year (REFER-06: strictly "successful" referrals).
  const startOfYear = new Date(
    Date.UTC(new Date().getUTCFullYear(), 0, 1),
  ).toISOString();

  const { count, error: countError } = await admin
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", auth.user.id)
    .eq("status", "rewarded")
    .gte("created_at", startOfYear);

  if (countError) {
    console.error(
      "[referral/create] cap check error:",
      countError.message,
    );
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }

  const current = count ?? 0;
  if (current >= ANNUAL_CAP) {
    return NextResponse.json(
      {
        ok: false,
        error: "annual_cap_reached",
        max: ANNUAL_CAP,
        current,
      },
      { status: 429 },
    );
  }

  // 4. Mint a globally-unique FRIEND-* code (Plan 10.02 library).
  let code: string;
  try {
    code = await generateUniqueFriendCode(admin);
  } catch (e) {
    console.error(
      "[referral/create] code gen exhausted:",
      (e as Error).message,
    );
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }

  // 5. Insert the pending row. Service role bypasses RLS — there is no
  //    INSERT policy on `public.referrals` by design (Plan 10.01).
  const { error: insertError } = await admin.from("referrals").insert({
    code,
    referrer_id: auth.user.id,
    status: "pending_invitee",
  });

  if (insertError) {
    console.error(
      "[referral/create] insert error:",
      insertError.message,
    );
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }

  // 6. Emit analytics event — PREFIX ONLY, never the full code (ANALYTICS-07).
  //    `referral_code_prefix` is the single permitted property on this event.
  await emitEvent(
    {
      name: "referral_code_generated",
      properties: { referral_code_prefix: "FRIEND" },
    },
    auth.user.id,
  );

  return NextResponse.json({ ok: true, code, reused: false });
}
