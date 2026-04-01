import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/subscription/status
 * يرجع حالة اشتراك المستخدم الحالي.
 * يُستخدم للـ polling بعد الدفع.
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_status, subscription_tier, expires_at, activated_at")
    .eq("id", auth.user.id)
    .maybeSingle();

  const isActive = profile?.subscription_status === "active";
  const isExpired =
    isActive && profile?.expires_at
      ? new Date(profile.expires_at) < new Date()
      : false;

  return NextResponse.json({
    ok: true,
    active: isActive && !isExpired,
    tier: profile?.subscription_tier ?? null,
    expires_at: profile?.expires_at ?? null,
    activated_at: profile?.activated_at ?? null,
  });
}
