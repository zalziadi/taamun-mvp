import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/invite/my-rewards
 *
 * Returns the authed user's invite rewards — both the ones they triggered
 * (invitees they successfully brought in) and the credit they earned.
 *
 * Shape:
 *   {
 *     earnedDays: number,
 *     redeemed: Array<{ created_at: string, rewarded_at: string | null }>
 *   }
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("invite_redemptions")
    .select("id, created_at, rewarded, rewarded_at")
    .eq("inviter_user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "db_error", details: error.message },
      { status: 500 }
    );
  }

  const list = rows ?? [];
  const rewardedCount = list.filter((r) => r.rewarded).length;

  return NextResponse.json({
    ok: true,
    earnedDays: rewardedCount * 30,
    totalInvited: list.length,
    rewardedCount,
    redeemed: list.map((r) => ({
      created_at: r.created_at,
      rewarded_at: r.rewarded_at,
      rewarded: r.rewarded,
    })),
  });
}
