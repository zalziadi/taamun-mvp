import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { listAllProgressRows } from "@/lib/progressStore";

export const dynamic = "force-dynamic";

interface ProgressRow {
  user_id: string;
  current_day: number | null;
  completed_days: string[] | null;
}

interface AnswerRow {
  user_id: string;
  day: number;
}

interface ActivationRow {
  code: string;
  tier: string;
  used_by: string | null;
  used_at: string | null;
  used_email: string | null;
}

interface SubscriptionRow {
  user_id: string;
  status: string;
  tier: string | null;
  current_period_end: string | null;
  created_at: string | null;
}

interface ReflectionRow {
  user_id: string;
  day: number;
  created_at: string;
}

export async function GET() {
  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  const supabase = adminAuth.admin;

  const [answersRes, progressRes, activationsRes, subscriptionsRes, reflectionsRes] =
    await Promise.all([
      supabase.from("user_answers").select("user_id, day"),
      listAllProgressRows(supabase),
      supabase
        .from("activation_codes")
        .select("code, tier, used_by, used_at, used_email")
        .not("used_by", "is", null)
        .order("used_at", { ascending: false })
        .limit(100),
      supabase
        .from("customer_subscriptions")
        .select("user_id, status, tier, current_period_end, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("reflections")
        .select("user_id, day, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  // Tolerate missing tables
  if (answersRes.error) console.warn("[admin/dashboard] answers:", answersRes.error.message);
  if (!progressRes.ok) console.warn("[admin/dashboard] progress:", (progressRes as any).error);
  if (subscriptionsRes.error) console.warn("[admin/dashboard] subscriptions:", subscriptionsRes.error.message);
  if (reflectionsRes.error) console.warn("[admin/dashboard] reflections:", reflectionsRes.error.message);

  const answerRows = (answersRes.data ?? []) as AnswerRow[];
  const progressRows = (progressRes.ok ? progressRes.data : []) as ProgressRow[];
  const activations = (activationsRes.data ?? []) as ActivationRow[];
  const subscriptions = (subscriptionsRes.data ?? []) as SubscriptionRow[];
  const reflections = (reflectionsRes.data ?? []) as ReflectionRow[];

  // Active users from answers + progress
  const uniqueUsers = new Set<string>();
  for (const row of answerRows) uniqueUsers.add(row.user_id);
  for (const row of progressRows) uniqueUsers.add(row.user_id);

  const completed28 = progressRows.filter((row) => (row.completed_days ?? []).length >= 28).length;

  // Progress map
  const progressMap = new Map<string, { current_day: number | null; completed_days: unknown }>();
  for (const row of progressRows) {
    progressMap.set(row.user_id, row);
  }

  // Reflections count per user
  const reflectionCounts = new Map<string, number>();
  for (const r of reflections) {
    reflectionCounts.set(r.user_id, (reflectionCounts.get(r.user_id) || 0) + 1);
  }

  // Build subscribers from activation_codes (primary source)
  // Group by user — keep latest activation per user
  const now = new Date();
  const userActivationMap = new Map<
    string,
    { email: string; tier: string; activated_at: string; code: string }
  >();

  for (const a of activations) {
    if (!a.used_by) continue;
    // Keep the latest (first in desc order)
    if (!userActivationMap.has(a.used_by)) {
      userActivationMap.set(a.used_by, {
        email: a.used_email || "—",
        tier: a.tier,
        activated_at: a.used_at || "",
        code: a.code,
      });
    }
  }

  // Also merge customer_subscriptions data
  const userSubMap = new Map<
    string,
    { tier: string; status: string; expires_at: string | null }
  >();
  for (const s of subscriptions) {
    if (!userSubMap.has(s.user_id)) {
      userSubMap.set(s.user_id, {
        tier: s.tier || "unknown",
        status: s.status,
        expires_at: s.current_period_end,
      });
    }
  }

  // Merge all unique subscriber user IDs
  const allSubscriberIds = new Set([
    ...userActivationMap.keys(),
    ...userSubMap.keys(),
  ]);

  // Tier breakdown and subscriber list
  const tierCounts: Record<string, number> = {};
  let activeCount = 0;
  let expiredCount = 0;
  const subscribers: Array<{
    id: string;
    email: string;
    tier: string;
    activated_at: string | null;
    expires_at: string | null;
    expired: boolean;
    current_day: number;
    completed_days: number;
    reflections: number;
  }> = [];

  for (const userId of allSubscriberIds) {
    const activation = userActivationMap.get(userId);
    const sub = userSubMap.get(userId);

    const tier = activation?.tier || sub?.tier || "unknown";
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;

    const expiresAt = sub?.expires_at || null;
    const isExpired = sub?.status === "canceled" || (expiresAt ? new Date(expiresAt) < now : false);

    if (isExpired) {
      expiredCount++;
    } else {
      activeCount++;
    }

    const prog = progressMap.get(userId);
    const completedDays = Array.isArray(prog?.completed_days) ? prog.completed_days.length : 0;

    subscribers.push({
      id: userId,
      email: activation?.email || "—",
      tier,
      activated_at: activation?.activated_at || sub?.expires_at || null,
      expires_at: expiresAt,
      expired: isExpired,
      current_day: prog?.current_day ?? 0,
      completed_days: completedDays,
      reflections: reflectionCounts.get(userId) || 0,
    });
  }

  // Sort subscribers: active first, then by activation date desc
  subscribers.sort((a, b) => {
    if (a.expired !== b.expired) return a.expired ? 1 : -1;
    return (b.activated_at || "").localeCompare(a.activated_at || "");
  });

  return NextResponse.json({
    ok: true,
    metrics: {
      users_active: uniqueUsers.size,
      answers_total: answerRows.length,
      users_completed_28: completed28,
      weekly_insights_total: 0,
      final_insights_total: 0,
    },
    report: {
      total_profiles: allSubscriberIds.size,
      active_subscribers: activeCount,
      expired_subscribers: expiredCount,
      tier_breakdown: tierCounts,
      total_reflections: reflections.length,
      recent_activations: activations.slice(0, 20),
      subscribers,
    },
  });
}
