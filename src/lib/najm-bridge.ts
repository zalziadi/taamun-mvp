/**
 * Najm Al-Janoub Bridge — connects Taamun pattern analyzer to the command center.
 * Generates nightly reports and detects improvement tasks.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { formatHijri, getHijriDate } from "@/lib/hijri";

const DISTRICT_NAMES: Record<number, string> = {
  1: "الهوية", 2: "العلاقات", 3: "التوسّع", 4: "البناء",
  5: "الجمال", 6: "العائلة", 7: "الروح", 8: "المال", 9: "العطاء",
};

type InsightRow = {
  user_id: string;
  district: number | null;
  awareness_state: string | null;
  depth_score: number;
  shift_detected: boolean;
  themes: string[];
};

type NajmTask = {
  title: string;
  description: string;
  type: "improvement" | "observation" | "alert";
  priority: "low" | "medium" | "high";
  district: number | null;
  metadata: Record<string, unknown>;
};

// ── Report Generation ────────────────────────────────────────────────────────

export async function generateNightlyReport(
  admin: SupabaseClient,
  insights: InsightRow[],
  cycleDay: number,
  aiSummaryFn: (prompt: string) => Promise<string | null>,
) {
  const activeUsers = insights.length;
  const totalUsers = activeUsers; // for now, same as active

  // District distribution
  const districtDist: Record<string, number> = {};
  for (const i of insights) {
    if (i.district) {
      const key = String(i.district);
      districtDist[key] = (districtDist[key] ?? 0) + 1;
    }
  }

  // State distribution
  const stateDist: Record<string, number> = { shadow: 0, gift: 0, potential: 0 };
  for (const i of insights) {
    if (i.awareness_state && i.awareness_state in stateDist) {
      stateDist[i.awareness_state]++;
    }
  }

  // Averages
  const avgDepth = activeUsers > 0
    ? Math.round(insights.reduce((s, i) => s + i.depth_score, 0) / activeUsers)
    : 0;
  const shiftsCount = insights.filter((i) => i.shift_detected).length;

  // AI summary
  const summaryPrompt = [
    "لخّص هذا التقرير الليلي لبرنامج تمعّن في جملتين بالعربي:",
    `- ${activeUsers} مستخدم نشط، يوم ${cycleDay}/28`,
    `- توزيع الأحياء: ${Object.entries(districtDist).map(([k, v]) => `${DISTRICT_NAMES[Number(k)] ?? k}: ${v}`).join("، ")}`,
    `- الحالات: ظل ${stateDist.shadow}، هدية ${stateDist.gift}، احتمال ${stateDist.potential}`,
    `- متوسط العمق: ${avgDepth}/100، تحوّلات: ${shiftsCount}`,
    "اجعل الملخص مختصرًا وعمليًا.",
  ].join("\n");

  const aiSummary = (await aiSummaryFn(summaryPrompt)) ?? `${activeUsers} مستخدم نشط، متوسط العمق ${avgDepth}/100، ${shiftsCount} تحوّلات.`;

  const hijri = getHijriDate();
  const hijriDate = formatHijri(hijri);

  const { error } = await admin.from("najm_reports").upsert({
    hijri_date: hijriDate,
    cycle_day: cycleDay,
    total_users: totalUsers,
    active_users: activeUsers,
    district_distribution: districtDist,
    state_distribution: stateDist,
    avg_depth_score: avgDepth,
    shifts_count: shiftsCount,
    ai_summary: aiSummary,
    raw_data: { insights_count: activeUsers, cycle_day: cycleDay },
  }, { onConflict: "cycle_day" });

  if (error) console.error("Failed to save najm report:", error);
  return !error;
}

// ── Task Detection ───────────────────────────────────────────────────────────

export async function detectImprovementTasks(
  admin: SupabaseClient,
  insights: InsightRow[],
  cycleDay: number,
) {
  if (insights.length === 0) return;

  const tasks: NajmTask[] = [];
  const activeUsers = insights.length;

  // District concentration: 70%+ in same district
  const districtCounts: Record<number, number> = {};
  for (const i of insights) {
    if (i.district) districtCounts[i.district] = (districtCounts[i.district] ?? 0) + 1;
  }
  for (const [d, count] of Object.entries(districtCounts)) {
    if (count / activeUsers >= 0.7) {
      const name = DISTRICT_NAMES[Number(d)] ?? d;
      tasks.push({
        title: `تركّز ٧٠%+ في حي ${name}`,
        description: `${count} من ${activeUsers} مستخدم في حي ${name} — اقتراح: تنويع المحتوى ليشمل أحياء أخرى أو تعميق هذا الحي.`,
        type: "improvement",
        priority: "medium",
        district: Number(d),
        metadata: { cycle_day: cycleDay, count, percentage: Math.round((count / activeUsers) * 100) },
      });
    }
  }

  // Shadow majority: 50%+ in shadow
  const shadowCount = insights.filter((i) => i.awareness_state === "shadow").length;
  if (shadowCount / activeUsers >= 0.5) {
    tasks.push({
      title: `أغلب المستخدمين في الظل (${Math.round((shadowCount / activeUsers) * 100)}%)`,
      description: `${shadowCount} من ${activeUsers} في حالة ظل — اقتراح: تعديل الأسئلة اليومية لتكون أقرب للمراقبة بدل التحليل.`,
      type: "improvement",
      priority: "high",
      district: null,
      metadata: { cycle_day: cycleDay, shadow_count: shadowCount },
    });
  }

  // Shifts detected
  const shifts = insights.filter((i) => i.shift_detected);
  if (shifts.length > 0) {
    tasks.push({
      title: `${shifts.length} تحوّلات مكتشفة اليوم`,
      description: `مستخدمون انتقلوا من كيف→عندي — فرصة لتعميق المحتوى في الأحياء المتأثرة.`,
      type: "observation",
      priority: "low",
      district: shifts[0]?.district ?? null,
      metadata: { cycle_day: cycleDay, shift_users: shifts.map((s) => s.user_id) },
    });
  }

  // Low depth
  const avgDepth = activeUsers > 0
    ? insights.reduce((s, i) => s + i.depth_score, 0) / activeUsers
    : 0;
  if (avgDepth < 30 && activeUsers >= 3) {
    tasks.push({
      title: `عمق منخفض: ${Math.round(avgDepth)}/100`,
      description: `متوسط العمق أقل من ٣٠ — اقتراح: مراجعة أسئلة التمعّن وتبسيطها.`,
      type: "alert",
      priority: "high",
      district: null,
      metadata: { cycle_day: cycleDay, avg_depth: Math.round(avgDepth) },
    });
  }

  // High depth (positive)
  if (avgDepth > 80 && activeUsers >= 3) {
    tasks.push({
      title: `عمق عالي: ${Math.round(avgDepth)}/100 ✦`,
      description: `متوسط العمق فوق ٨٠ — ملاحظة إيجابية: المستخدمون في حالة حضور عالية.`,
      type: "observation",
      priority: "low",
      district: null,
      metadata: { cycle_day: cycleDay, avg_depth: Math.round(avgDepth) },
    });
  }

  // Insert tasks
  if (tasks.length > 0) {
    const { error } = await admin.from("najm_tasks").insert(
      tasks.map((t) => ({ ...t, source: "analyzer" }))
    );
    if (error) console.error("Failed to create najm tasks:", error);
  }

  return tasks.length;
}
