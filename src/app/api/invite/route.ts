import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Random short code — collision-resistant enough for our scale (base36, 8 chars).
 */
function generateCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // no O/0/I/1/l confusion
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * GET /api/invite
 * Returns the user's invite code (creating one if missing) + stats.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = auth.user.id;
  const admin = getSupabaseAdmin();

  // Look for existing code
  const { data: existing } = await admin
    .from("invite_codes")
    .select("code, uses, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    // Count successful redemptions (rewarded)
    const { count: rewardedCount } = await admin
      .from("invite_redemptions")
      .select("*", { count: "exact", head: true })
      .eq("inviter_user_id", userId)
      .eq("rewarded", true);

    return NextResponse.json({
      ok: true,
      code: existing.code,
      uses: existing.uses,
      rewarded: rewardedCount ?? 0,
    });
  }

  // Create one — try up to 5 times for uniqueness
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await admin
      .from("invite_codes")
      .insert({ code, user_id: userId });
    if (!error) {
      return NextResponse.json({ ok: true, code, uses: 0, rewarded: 0 });
    }
    // Duplicate code — try again
  }

  return NextResponse.json({ error: "code_generation_failed" }, { status: 500 });
}

/**
 * POST /api/invite
 * Called during signup to redeem a code. Records the redemption.
 * Body: { code: string }
 *
 * Reward is applied later via /api/cron/reward-invites when the invitee
 * actually becomes a paying subscriber (to prevent free-month fraud).
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = body.code?.trim().toLowerCase();
  if (!code) {
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Look up code
  const { data: codeRow } = await admin
    .from("invite_codes")
    .select("code, user_id")
    .eq("code", code)
    .maybeSingle();

  if (!codeRow) {
    return NextResponse.json({ error: "invalid_code" }, { status: 404 });
  }

  // Can't invite yourself
  if (codeRow.user_id === auth.user.id) {
    return NextResponse.json({ error: "self_invite" }, { status: 400 });
  }

  // Record redemption (fails gracefully if this invitee already redeemed)
  const { error: insertErr } = await admin.from("invite_redemptions").insert({
    code,
    inviter_user_id: codeRow.user_id,
    invitee_user_id: auth.user.id,
    rewarded: false,
  });

  if (insertErr) {
    // Likely already redeemed (unique constraint)
    return NextResponse.json({ ok: true, already_redeemed: true });
  }

  // Increment uses counter (non-atomic-critical — best-effort)
  await admin.rpc("increment_invite_uses", { p_code: code }).then(() => {}, () => {});

  return NextResponse.json({ ok: true });
}
