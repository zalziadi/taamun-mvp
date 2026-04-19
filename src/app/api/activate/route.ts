import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { makeEntitlementToken, COOKIE_NAME } from "@/lib/entitlement";
import { calcExpiresAt, cookieMaxAge } from "@/lib/subscriptionDurations";
import { FRIEND_CODE_REGEX } from "@/lib/referral/generate";
import { emitEvent } from "@/lib/analytics/server";

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

  /* ── 2.5 Phase 10: FRIEND-* referral redemption branch ──
   * REFER-01 namespace distinction: FRIEND-* is a separate namespace from
   * TAAMUN-* (entitlement codes). Codes that match FRIEND_CODE_REGEX skip
   * activation_codes entirely and flow through the referrals table. The
   * TAAMUN-* path below is byte-identical to Phase 9 (regression-safe per
   * CLAUDE.md rule S1).
   *
   * Ordering is load-bearing: lookup → self-check → profile → referral
   * update → emit → cookie. If profile upsert fails we haven't touched
   * referrals yet; if referrals update fails after profile upsert, the
   * invitee still has their free month (logged, admin-reconcilable).
   */
  if (FRIEND_CODE_REGEX.test(code)) {
    let friendAdmin;
    try {
      friendAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json({ ok: false, error: "server_misconfig" }, { status: 500 });
    }

    const { data: referralRow, error: referralLookupError } = await friendAdmin
      .from("referrals")
      .select("id, referrer_id, invitee_id, status")
      .eq("code", code)
      .maybeSingle();

    if (referralLookupError) {
      console.error("[activate/friend] lookup error:", referralLookupError.message);
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }
    if (!referralRow) {
      return NextResponse.json({ ok: false, error: "الكود غير صالح." }, { status: 404 });
    }
    if (referralRow.invitee_id !== null) {
      return NextResponse.json({ ok: false, error: "هذا الكود مستخدم مسبقاً." }, { status: 409 });
    }
    // REFER-07 defense-in-depth: app-layer self-referral reject.
    // The DB CHECK referrals_no_self_referral is the backstop but a 409 with
    // a specific error string is friendlier than a 500 from a constraint.
    if (referralRow.referrer_id === auth.user.id) {
      return NextResponse.json(
        { ok: false, error: "self_referral_forbidden" },
        { status: 409 }
      );
    }

    // Invitee free month per REFER-03 — tier='monthly' (30 days).
    const friendTier = "monthly";
    const friendNow = new Date();
    const friendExpiresAt = calcExpiresAt(friendTier, friendNow);

    const { error: friendProfileError } = await friendAdmin
      .from("profiles")
      .upsert(
        {
          id: auth.user.id,
          subscription_status: "active",
          subscription_tier: friendTier,
          activated_at: friendNow.toISOString(),
          expires_at: friendExpiresAt,
        },
        { onConflict: "id" }
      );
    if (friendProfileError) {
      console.error("[activate/friend] profile upsert error:", friendProfileError.message);
      return NextResponse.json(
        { ok: false, error: "تعذر تحديث حالة الاشتراك." },
        { status: 500 }
      );
    }

    // Phase 9 RENEW-03 preservation: tag original_gateway='eid_code' if null.
    try {
      const { error: friendGatewayTagError } = await friendAdmin
        .from("profiles")
        .update({ original_gateway: "eid_code" })
        .eq("id", auth.user.id)
        .is("original_gateway", null);
      if (friendGatewayTagError) {
        console.warn(
          "[activate/friend] original_gateway tag failed (non-blocking):",
          friendGatewayTagError.message
        );
      }
    } catch (e) {
      console.warn("[activate/friend] original_gateway tag threw (non-blocking):", e);
    }

    // Mark referral as pending_day14 — cron at Plan 10.05 credits referrer.
    const { error: referralUpdateError } = await friendAdmin
      .from("referrals")
      .update({
        invitee_id: auth.user.id,
        invitee_redeemed_at: friendNow.toISOString(),
        status: "pending_day14",
      })
      .eq("id", referralRow.id);
    if (referralUpdateError) {
      // Compensating action: invitee already got their free month above.
      // Log and continue — admin can reconcile from profiles.activated_at.
      // Rolling back the profile upsert would leave the invitee with no
      // access after redeeming, which is worse UX.
      console.error("[activate/friend] referral update error:", referralUpdateError.message);
    }

    // REFER-07 / ANALYTICS-07: prefix-only, never the full code.
    await emitEvent(
      { name: "referral_code_redeemed", properties: { referral_code_prefix: "FRIEND" } },
      auth.user.id
    );

    const friendToken = makeEntitlementToken(auth.user.id, friendTier, friendExpiresAt);
    const friendRes = NextResponse.json({
      ok: true,
      tier: friendTier,
      expires_at: friendExpiresAt,
      via: "friend_referral",
    });
    friendRes.cookies.set(COOKIE_NAME, friendToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAge(friendTier),
    });
    return friendRes;
  }
  /* ── End FRIEND-* branch — TAAMUN-* flow continues below (unchanged) ── */

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

  // Phase 9 RENEW-03: tag first-seen gateway as 'eid_code' for renewal CTA routing.
  // Guarded by .is("original_gateway", null) so first-gateway-wins. If this user
  // previously paid via Salla/Tap/Stripe, their prior gateway tag is preserved.
  // Best-effort: failure is logged but never blocks activation.
  try {
    const { error: gatewayTagError } = await admin
      .from("profiles")
      .update({ original_gateway: "eid_code" })
      .eq("id", auth.user.id)
      .is("original_gateway", null);
    if (gatewayTagError) {
      console.warn(
        "[activate] original_gateway tag failed (non-blocking):",
        gatewayTagError.message
      );
    }
  } catch (e) {
    console.warn("[activate] original_gateway tag threw (non-blocking):", e);
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
