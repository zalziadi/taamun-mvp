import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { calcExpiresAt } from "@/lib/subscriptionDurations";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { admin } = auth;

  // Fetch all profiles
  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, full_name, role, subscription_status, subscription_tier, activated_at, expires_at, created_at")
    .order("created_at", { ascending: false });

  if (pErr) {
    return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });
  }

  // Fetch emails from auth.users
  const { data: authData, error: aErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (aErr) {
    return NextResponse.json({ ok: false, error: aErr.message }, { status: 500 });
  }

  const emailMap: Record<string, string> = {};
  for (const u of authData.users) {
    if (u.email) emailMap[u.id] = u.email;
  }

  const users = (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap[p.id] ?? null,
  }));

  return NextResponse.json({ ok: true, users });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { admin } = auth;
  const body = await req.json();
  const { userId, tier = "vip" } = body;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }

  const now = new Date();
  const expiresAt = calcExpiresAt(tier, now);

  const { data, error } = await admin
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_tier: tier,
      activated_at: now.toISOString(),
      expires_at: expiresAt,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: data });
}
