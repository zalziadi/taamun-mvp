import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyEntitlementToken } from "@/lib/entitlement";
import { ENTITLEMENT_COOKIE_NAME } from "@/lib/entitlement-constants";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ENTITLEMENT_COOKIE_NAME)?.value;
  const verified = verifyEntitlementToken(token);
  if (!verified.ok) {
    return NextResponse.json({ ok: true, status: "expired", plan: null, endsAt: null });
  }

  const nowIso = new Date().toISOString();
  const expIso = new Date(verified.exp).toISOString();
  const plan = typeof verified.plan === "string" ? verified.plan : null;
  if (!plan) {
    return NextResponse.json({ ok: true, status: "expired", plan: null, endsAt: null });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("entitlements")
    .select("plan, status, ends_at")
    .eq("plan", plan)
    .eq("status", "active")
    .gte("ends_at", nowIso)
    .order("ends_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const row = data?.[0];
  if (!row) {
    return NextResponse.json({ ok: true, status: "expired", plan, endsAt: expIso });
  }

  return NextResponse.json({
    ok: true,
    status: "active",
    plan: row.plan,
    endsAt: row.ends_at,
  });
}
