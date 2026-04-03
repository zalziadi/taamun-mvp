import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { listAllProgressRows } from "@/lib/progressStore";

export const dynamic = "force-dynamic";

interface ProgressRow {
  user_id: string;
  current_day: number | null;
  completed_days: string[] | null;
}

interface AwarenessRow {
  user_id: string;
  insight_type: string;
}

interface AnswerRow {
  user_id: string;
  day: number;
}

interface ProfileRow {
  id: string;
  email?: string;
  full_name?: string;
  subscription_status?: string;
  subscription_tier?: string;
  activated_at?: string;
  expires_at?: string;
  created_at?: string;
}

interface ActivationRow {
  code: string;
  tier: string;
  used_by: string | null;
  used_at: string | null;
  used_email: string | null;
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

  const [answersRes, progressRes, awarenessRes, profilesRes, activationsRes, reflectionsRes] =
    await Promise.all([
      supabase.from("user_answers").select("user_id, day"),
      listAllProgressRows(supabase),
      supabase.from("awareness_insights").select("user_id, insight_type"),
      supabase
        .from("profiles")
        .select("id, email, full_name, subscription_status, subscription_tier, activated_at, expires_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("activation_codes")
        .select("code, tier, used_by, used_at, used_email")
        .not("used_by", "is", null)
        .order("used_at", { ascending: false })
        .limit(50),
      supabase
        .from("reflections")
        .select("user_id, day, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  if (answersRes.error || !progressRes.ok || awarenessRes.error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const answerRows = (answersRes.data ?? []) as AnswerRow[];
  const progressRows = (progressRes.data ?? []) as ProgressRow[];
  const awarenessRows = (awarenessRes.data ?? []) as AwarenessRow[];
  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const activations = (activationsRes.data ?? []) as ActivationRow[];
  const reflections = (reflectionsRes.data ?? []) as ReflectionRow[];

  const uniqueUsers = new Set<string>();
  for (const row of answerRows) uniqueUsers.add(row.user_id);
  for (const row of progressRows) uniqueUsers.add(row.user_id);

  const completed28 = progressRows.filter((row) => (row.completed_days ?? []).length >= 28).length;
  const weeklyInsights = awarenessRows.filter((row) => row.insight_type === "weekly").length;
  const finalInsights = awarenessRows.filter((row) => row.insight_type === "final").length;

  // Tier breakdown
  const tierCounts: Record<string, number> = {};
  const activeSubscribers: ProfileRow[] = [];
  const expiredSubscribers: ProfileRow[] = [];
  const now = new Date();

  for (const p of profiles) {
    if (p.subscription_status === "active") {
      const tier = p.subscription_tier || "unknown";
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;

      const isExpired = p.expires_at ? new Date(p.expires_at) < now : false;
      if (isExpired) {
        expiredSubscribers.push(p);
      } else {
        activeSubscribers.push(p);
      }
    }
  }

  // Progress map for enriching subscriber data
  const progressMap = new Map<string, { current_day: number | null; completed_days: unknown }>();
  for (const row of progressRows) {
    progressMap.set(row.user_id, row);
  }

  // Reflections count per user
  const reflectionCounts = new Map<string, number>();
  for (const r of reflections) {
    reflectionCounts.set(r.user_id, (reflectionCounts.get(r.user_id) || 0) + 1);
  }

  // Build subscriber details
  const subscribers = profiles
    .filter((p) => p.subscription_status === "active")
    .map((p) => {
      const prog = progressMap.get(p.id);
      const completedDays = Array.isArray(prog?.completed_days) ? prog.completed_days.length : 0;
      return {
        id: p.id,
        email: p.email || p.full_name || "—",
        tier: p.subscription_tier || "—",
        activated_at: p.activated_at,
        expires_at: p.expires_at,
        expired: p.expires_at ? new Date(p.expires_at) < now : false,
        current_day: prog?.current_day ?? 0,
        completed_days: completedDays,
        reflections: reflectionCounts.get(p.id) || 0,
      };
    });

  return NextResponse.json({
    ok: true,
    metrics: {
      users_active: uniqueUsers.size,
      answers_total: answerRows.length,
      users_completed_28: completed28,
      weekly_insights_total: weeklyInsights,
      final_insights_total: finalInsights,
    },
    report: {
      total_profiles: profiles.length,
      active_subscribers: activeSubscribers.length,
      expired_subscribers: expiredSubscribers.length,
      tier_breakdown: tierCounts,
      total_reflections: reflections.length,
      recent_activations: activations.slice(0, 20),
      subscribers,
    },
  });
}
