import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type ProgressRow = {
  current_day: number | null;
};

type AwarenessRow = {
  level: string;
};

type VerseRow = {
  theme_title: string | null;
};

/**
 * GET /api/guide/prompts
 * Returns personalized quick prompts based on subscriber's current state.
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let currentDay = 1;
  let awarenessLogs: AwarenessRow[] = [];
  let theme = "";

  try {
    const admin = getSupabaseAdmin();

    const [progressRes, awarenessRes] = await Promise.all([
      admin.from("progress").select("current_day").eq("user_id", auth.user.id).maybeSingle(),
      admin
        .from("awareness_logs")
        .select("level")
        .eq("user_id", auth.user.id)
        .order("day", { ascending: false })
        .limit(3),
    ]);

    const progress = progressRes.data as ProgressRow | null;
    awarenessLogs = (awarenessRes.data ?? []) as AwarenessRow[];
    currentDay = progress?.current_day ?? 1;

    // Get today's theme
    if (currentDay) {
      const { data } = await admin
        .from("ramadan_verses")
        .select("theme_title")
        .eq("day", currentDay)
        .maybeSingle();
      theme = (data as VerseRow | null)?.theme_title ?? "";
    }
  } catch (err) {
    console.warn("[guide/prompts] DB query failed, using defaults:", err instanceof Error ? err.message : String(err));
  }

  // Determine awareness state
  const recentLevels = awarenessLogs.map((a) => a.level);
  const isDistracted = recentLevels.filter((l) => l === "distracted").length >= 2;
  const isPresent = recentLevels.filter((l) => l === "present").length >= 2;

  // Build personalized prompts
  const prompts: string[] = [];

  // Prompt 1: Based on day phase
  if (currentDay <= 7) {
    prompts.push("كيف أبدأ رحلة التمعّن بطريقة عملية اليوم؟");
  } else if (currentDay <= 14) {
    prompts.push("هل لاحظت نمطاً يتكرر عندي في هذه الأيام؟");
  } else if (currentDay <= 21) {
    prompts.push("ما أعمق شيء فهمته عن نفسي حتى الآن في الرحلة؟");
  } else {
    prompts.push("كيف أحافظ على ما تعلمته بعد انتهاء البرنامج؟");
  }

  // Prompt 2: Based on awareness state
  if (isDistracted) {
    prompts.push("أحس بتشتت هذه الأيام. كيف أرجع للحضور؟");
  } else if (isPresent) {
    prompts.push("أريد أن أتعمق أكثر في تأمل اليوم.");
  } else {
    prompts.push("كيف أتحول من الظل إلى الهدية في موقف يتكرر معي؟");
  }

  // Prompt 3: Based on today's theme
  if (theme) {
    prompts.push(`كيف أطبق موضوع "${theme}" على يومي بشكل عملي؟`);
  } else {
    prompts.push("أعطني تمرين تمعّن قصير قبل النوم.");
  }

  return NextResponse.json({ ok: true, prompts, day: currentDay });
}
