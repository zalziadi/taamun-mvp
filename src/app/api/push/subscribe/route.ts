import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/push/subscribe
 * Saves the user's web push subscription.
 *
 * Body: {
 *   endpoint: string,
 *   keys: { p256dh: string, auth: string },
 *   morningHour?: number (0-23, default 6)
 * }
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  type Body = {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    morningHour?: number;
    userAgent?: string;
  };
  const body = (await req.json().catch(() => ({}))) as Body;

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json(
      { error: "invalid_subscription" },
      { status: 400 }
    );
  }

  const morningHour = typeof body.morningHour === "number"
    ? Math.max(0, Math.min(23, body.morningHour))
    : 6;

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: auth.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        user_agent: body.userAgent ?? null,
        morning_enabled: true,
        morning_hour: morningHour,
        streak_at_risk_enabled: true,
      },
      { onConflict: "user_id,endpoint" }
    );

  if (error) {
    return NextResponse.json(
      { error: "db_error", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

/**
 * PATCH /api/push/subscribe
 * Update preferences without re-subscribing.
 * Body: { endpoint: string, morningHour?: number, morningEnabled?: boolean, streakAtRiskEnabled?: boolean }
 */
export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  type PatchBody = {
    endpoint?: string;
    morningHour?: number;
    morningEnabled?: boolean;
    streakAtRiskEnabled?: boolean;
  };
  const body = (await req.json().catch(() => ({}))) as PatchBody;

  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint_required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.morningHour === "number") {
    updates.morning_hour = Math.max(0, Math.min(23, body.morningHour));
  }
  if (typeof body.morningEnabled === "boolean") {
    updates.morning_enabled = body.morningEnabled;
  }
  if (typeof body.streakAtRiskEnabled === "boolean") {
    updates.streak_at_risk_enabled = body.streakAtRiskEnabled;
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .update(updates)
    .eq("user_id", auth.user.id)
    .eq("endpoint", body.endpoint);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
