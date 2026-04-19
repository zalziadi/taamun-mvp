import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { applyInviteReward } from "@/lib/invite-rewards";

export const dynamic = "force-dynamic";

/**
 * POST /api/invite/apply-reward
 *
 * Idempotent endpoint that applies +30 days to both inviter and invitee
 * on successful first subscription. Designed to be called from:
 *   - Payment webhooks (Stripe / Salla / Tap) — pass the invitee user_id
 *   - Admin manual trigger (for edge cases)
 *
 * Auth: requires ADMIN_MIGRATION_KEY or SUPABASE_SERVICE_ROLE_KEY.
 *
 * Body: { key: string, userId: string }
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    key?: string;
    userId?: string;
  };

  const expectedKey =
    process.env.ADMIN_MIGRATION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!body.key || !expectedKey || body.key !== expectedKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!body.userId || typeof body.userId !== "string") {
    return NextResponse.json({ error: "userId_required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const result = await applyInviteReward(admin, body.userId);

  return NextResponse.json({ ok: true, ...result });
}
