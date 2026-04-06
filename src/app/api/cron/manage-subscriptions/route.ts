import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { daysRemaining } from "@/lib/subscriptionDurations";

export const dynamic = "force-dynamic";

/**
 * مسخّر — Cron يومي لإدارة الاشتراكات تلقائياً
 *
 * 1. تنبيه قبل الانتهاء بأسبوع (يضيف إيميل في email_queue)
 * 2. إلغاء الاشتراكات المنتهية (يغيّر الحالة لـ expired)
 * 3. إرسال إشعار انتهاء (يضيف إيميل في email_queue)
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const appUrl = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://www.taamun.com";
  const now = new Date().toISOString();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  let warned = 0;
  let expired = 0;

  // ─── 1. تنبيه قبل الانتهاء بأسبوع ───
  const { data: soonExpiring } = await admin
    .from("profiles")
    .select("id, full_name, subscription_tier, expires_at")
    .eq("subscription_status", "active")
    .gt("expires_at", now)
    .lte("expires_at", sevenDaysFromNow);

  if (soonExpiring && soonExpiring.length > 0) {
    // جلب الإيميلات
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap: Record<string, string> = {};
    for (const u of authData?.users ?? []) {
      if (u.email) emailMap[u.id] = u.email;
    }

    for (const profile of soonExpiring) {
      const email = emailMap[profile.id];
      if (!email) continue;

      const days = daysRemaining(profile.expires_at);

      // تحقق إنه ما أرسلنا تنبيه لهذا المستخدم خلال آخر 5 أيام
      const { data: recentEmail } = await admin
        .from("email_queue")
        .select("id")
        .eq("user_id", profile.id)
        .eq("template", "expiry_warning")
        .gte("created_at", new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recentEmail && recentEmail.length > 0) continue;

      await admin.from("email_queue").insert({
        user_id: profile.id,
        email,
        template: "expiry_warning",
        payload: {
          userName: profile.full_name || email.split("@")[0],
          daysLeft: days,
          tier: profile.subscription_tier ?? "monthly",
          appUrl,
        },
        status: "pending",
        send_after: now,
      });

      warned++;
    }
  }

  // ─── 2 + 3. إلغاء المنتهية + إرسال إشعار ───
  const { data: expiredProfiles } = await admin
    .from("profiles")
    .select("id, full_name, subscription_tier, expires_at")
    .eq("subscription_status", "active")
    .lt("expires_at", now);

  if (expiredProfiles && expiredProfiles.length > 0) {
    const { data: authData2 } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap2: Record<string, string> = {};
    for (const u of authData2?.users ?? []) {
      if (u.email) emailMap2[u.id] = u.email;
    }

    for (const profile of expiredProfiles) {
      // إلغاء الاشتراك
      await admin
        .from("profiles")
        .update({ subscription_status: "expired" })
        .eq("id", profile.id);

      // إرسال إشعار انتهاء
      const email = emailMap2[profile.id];
      if (email) {
        await admin.from("email_queue").insert({
          user_id: profile.id,
          email,
          template: "expired",
          payload: {
            userName: profile.full_name || email.split("@")[0],
            tier: profile.subscription_tier ?? "monthly",
            appUrl,
          },
          status: "pending",
          send_after: now,
        });
      }

      expired++;
    }
  }

  return NextResponse.json({
    ok: true,
    warned,
    expired,
    timestamp: now,
  });
}
