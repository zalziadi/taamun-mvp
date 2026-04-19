import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/referral/list — auth-gated listing of the caller's own referrals
 * for the /account/referral status table (Plan 10.05, REFER-11 transparency).
 *
 * Privacy contract:
 *   - SELECT column whitelist: id, code, status, invitee_redeemed_at,
 *     referrer_rewarded_at, created_at.
 *   - Never returns `invitee_id` — the invitee's identity is deliberately
 *     opaque to the referrer. The referrer sees status labels only.
 *   - Filters on `referrer_id = auth.user.id` — a user can only read their
 *     own rows even though this route uses service-role (service-role bypasses
 *     RLS; the .eq filter is the authoritative scope).
 *
 * No pagination (v1.2 scale: max 3 rewarded/year + pending rows → at most
 * ~10 rows per user in practice).
 *
 * Response contract:
 *   200 { ok: true, referrals: ReferralRow[] }
 *   401 { ok: false, error: "unauthorized" }   // via requireUser()
 *   500 { ok: false, error: "server_misconfig" | "server_error" }
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { ok: false, error: "server_misconfig" },
      { status: 500 },
    );
  }

  const { data, error } = await admin
    .from("referrals")
    .select(
      "id, code, status, invitee_redeemed_at, referrer_rewarded_at, created_at",
    )
    .eq("referrer_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[referral/list] DB error:", error.message);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, referrals: data ?? [] });
}
