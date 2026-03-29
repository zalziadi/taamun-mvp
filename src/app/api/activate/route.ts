import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { makeEntitlementToken, COOKIE_NAME } from "@/lib/entitlement";
import { calcExpiresAt, cookieMaxAge } from "@/lib/subscriptionDurations";

/**
 * POST /api/activate
 * يستقبل { code: "TAAMUN-XXXX" }
 * يتحقق من الكود في جدول `activation_codes` على Supabase
 * إذا صالح: يكتب entitlement cookie ويحدّث الكود كـ used
 */
export async function POST(req: NextRequest) {
  /* ── 1. تحقق من تسجيل الدخول ── */
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  /* ── 2. قراءة الكود ── */
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ ok: false, error: "الكود مطلوب." }, { status: 400 });
  }

  /* ── 3. التحقق من الكود في Supabase ── */
  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "server_misconfig" }, { status: 500 });
  }

  const { data: codeRow, error: codeError } = await admin
    .from("activation_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (codeError) {
    console.error("[activate] DB error:", codeError.message);
    return NextResponse.json({ ok: false, error: "خطأ في الخادم." }, { status: 500 });
  }

  if (!codeRow) {
    return NextResponse.json({ ok: false, error: "الكود غير صالح." }, { status: 404 });
  }

  if (codeRow.used_by) {
    return NextResponse.json({ ok: false, error: "هذا الكود مستخدم مسبقاً." }, { status: 409 });
  }

  /* ── 4. حدّث الكود كـ used ── */
  const tier = codeRow.tier || "monthly";
  const { error: updateError } = await admin
    .from("activation_codes")
    .update({
      used_by: auth.user.id,
      used_at: new Date().toISOString(),
      used_email: auth.user.email,
    })
    .eq("id", codeRow.id);

  if (updateError) {
    console.error("[activate] Update error:", updateError.message);
    return NextResponse.json({ ok: false, error: "خطأ في التفعيل." }, { status: 500 });
  }

  /* ── 5. حدّث profile المستخدم ── */
  const now = new Date();
  const expiresAt = calcExpiresAt(tier, now);

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({
      id: auth.user.id,
      subscription_status: "active",
      subscription_tier: tier,
      activated_at: now.toISOString(),
      expires_at: expiresAt,
    }, { onConflict: "id" });

  if (profileError) {
    console.error("[activate] profile upsert error:", profileError.message);
    return NextResponse.json({ ok: false, error: "تعذر تحديث حالة الاشتراك." }, { status: 500 });
  }

  /* ── 6. أنشئ entitlement token واكتبه في cookie ── */
  const token = makeEntitlementToken(auth.user.id, tier, expiresAt);

  const res = NextResponse.json({ ok: true, tier, expires_at: expiresAt });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAge(tier),
  });

  return res;
}
