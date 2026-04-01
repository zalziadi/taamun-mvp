import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getDayIndexForToday } from "@/lib/ramadan-28";
import { getHijriDate } from "@/lib/hijri";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // seconds — margin for slow API responses

// ── Types ────────────────────────────────────────────────────────────────────
type AIPatternResult = {
  themes: string[];
  depth_score: number;
  shift_detected: boolean;
  shift_description: string | null;
  daily_hint: string;
  weekly_summary: string | null;
};

type UserAnswer = {
  user_id: string;
  observe: string | null;
  insight: string | null;
  contemplate: string | null;
  rebuild: string | null;
};

// ── Anthropic call ───────────────────────────────────────────────────────────
async function callAnthropic(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  return data.content?.find((item) => item.type === "text")?.text?.trim() || null;
}

// ── JSON extractor (same pattern as insight route) ───────────────────────────
function extractJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw.trim()) as Record<string, unknown>;
  } catch { /* continue */ }

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1]) as Record<string, unknown>; }
    catch { /* continue */ }
  }

  const start = raw.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    if (raw[i] === "}") depth--;
    if (depth === 0) {
      try { return JSON.parse(raw.slice(start, i + 1)) as Record<string, unknown>; }
      catch { return null; }
    }
  }
  return null;
}

// ── Normalize AI response ────────────────────────────────────────────────────
function normalizeResult(parsed: Record<string, unknown> | null): AIPatternResult {
  const themes = Array.isArray(parsed?.themes)
    ? (parsed.themes as string[]).filter((t) => typeof t === "string").slice(0, 10)
    : ["تأمل عام"];
  const raw = Number(parsed?.depth_score);
  const depth_score = Number.isFinite(raw) ? Math.max(0, Math.min(100, Math.round(raw))) : 50;
  const shift_detected = parsed?.shift_detected === true;
  const shift_description = shift_detected && typeof parsed?.shift_description === "string"
    ? parsed.shift_description
    : null;
  const daily_hint = typeof parsed?.daily_hint === "string" && parsed.daily_hint.trim()
    ? parsed.daily_hint.trim()
    : "واصل التمعّن بصدق — كل يوم يكشف طبقة جديدة.";
  const weekly_summary = typeof parsed?.weekly_summary === "string" && parsed.weekly_summary.trim()
    ? parsed.weekly_summary.trim()
    : null;

  return { themes, depth_score, shift_detected, shift_description, daily_hint, weekly_summary };
}

// ── Build prompt ─────────────────────────────────────────────────────────────
function buildPatternPrompt(args: {
  todayAnswer: UserAnswer;
  previousThemes: string[];
  cycleDay: number;
  isWeekEnd: boolean;
}): string {
  const { todayAnswer, previousThemes, cycleDay, isWeekEnd } = args;

  const weeklyExtra = isWeekEnd
    ? `, "weekly_summary": "ملخص الأسبوع في 2-3 جمل"`
    : "";

  return [
    "أنت مرآة صامتة لبرنامج تمعّن الرمضاني.",
    "مهمتك: مراقبة النمط اللغوي للمستخدم واكتشاف لحظات الانتقال.",
    "",
    "القاعدة الجوهرية:",
    "التحوّل الحقيقي يظهر في اللغة — عندما ينتقل الإنسان من 'كيف' إلى 'عندي':",
    "- لغة 'كيف' = عقل تائه يبحث عن حل خارجي (كيف أسوي، كيف أتغلب، كيف أوصل، أحتاج، ينقصني)",
    "- لغة 'عندي' = عقل وقلب متصلان بالموجود في اللحظة (عندي، ألاحظ، أملك، أرى، وجدت)",
    "هذا الانتقال هو لحظة إدراك الهدية.",
    "",
    "لا تُصدر أحكامًا — اعكس ما تلاحظه فقط. استخدم 'لاحظنا' وليس 'يجب عليك'.",
    "",
    `اليوم في الدورة: ${cycleDay}/28`,
    previousThemes.length > 0
      ? `المواضيع السابقة: ${previousThemes.join("، ")}`
      : "لا توجد أنماط سابقة (اليوم الأول).",
    "",
    "إجابات اليوم:",
    `- المُلاحَظ: ${todayAnswer.observe?.trim() || "(فارغ)"}`,
    `- الإدراك: ${todayAnswer.insight?.trim() || "(فارغ)"}`,
    `- التمعّن: ${todayAnswer.contemplate?.trim() || "(فارغ)"}`,
    `- إعادة البناء: ${todayAnswer.rebuild?.trim() || "(فارغ)"}`,
    "",
    "أعد JSON فقط بدون أي نص إضافي:",
    `{"themes":["موضوع1","موضوع2"],"depth_score":0,"shift_detected":false,"shift_description":null,"daily_hint":"تلميح لليوم التالي"${weeklyExtra}}`,
    "",
    "themes: المواضيع الوجدانية المكتشفة (توكل، صبر، شكر، خوف، تسليم، حضور، بحث، إلخ) — 2-5 مواضيع.",
    "depth_score: درجة الحضور مع الموجود (0-100). 0 = بحث خارجي كامل ('كيف'). 100 = حضور تام مع ما عنده ('عندي').",
    "shift_detected: هل انتقل من لغة 'كيف' إلى لغة 'عندي' مقارنة بالأيام السابقة؟",
    "shift_description: وصف الانتقال اللغوي إن وُجد، null إذا لم يوجد.",
    "daily_hint: تلميح يعكس ما لاحظته — لا يوجّه. جملة واحدة.",
  ].join("\n");
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const cycleDay = getDayIndexForToday();
  const hijri = getHijriDate();
  const weekNumber = Math.ceil(cycleDay / 7);
  const isWeekEnd = cycleDay % 7 === 0;

  // Find active users: those who answered today
  const { data: todayAnswers, error: fetchErr } = await admin
    .from("user_answers")
    .select("user_id, observe, insight, contemplate, rebuild")
    .eq("day", cycleDay);

  if (fetchErr || !todayAnswers) {
    console.error("Failed to fetch today answers:", fetchErr);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }

  const results: { user_id: string; ok: boolean; error?: string }[] = [];

  for (const answer of todayAnswers as UserAnswer[]) {
    try {
      // Check if already analyzed today
      const { data: existing } = await admin
        .from("pattern_insights")
        .select("id")
        .eq("user_id", answer.user_id)
        .eq("hijri_year", hijri.year)
        .eq("hijri_month", hijri.month)
        .eq("hijri_day", hijri.day)
        .maybeSingle();

      if (existing) {
        results.push({ user_id: answer.user_id, ok: true, error: "already_analyzed" });
        continue;
      }

      // Get previous themes for context
      const { data: prevInsights } = await admin
        .from("pattern_insights")
        .select("themes")
        .eq("user_id", answer.user_id)
        .order("created_at", { ascending: false })
        .limit(7);

      const previousThemes = (prevInsights ?? [])
        .flatMap((row) => (row.themes as string[]) ?? [])
        .filter((t, i, arr) => arr.indexOf(t) === i)
        .slice(0, 15);

      // Call AI
      const prompt = buildPatternPrompt({
        todayAnswer: answer,
        previousThemes,
        cycleDay,
        isWeekEnd,
      });
      const aiRaw = await callAnthropic(prompt);
      const parsed = aiRaw ? extractJson(aiRaw) : null;
      const result = normalizeResult(parsed);

      // Save to pattern_insights
      const { error: insertErr } = await admin.from("pattern_insights").insert({
        user_id: answer.user_id,
        hijri_year: hijri.year,
        hijri_month: hijri.month,
        hijri_day: hijri.day,
        cycle_day: cycleDay,
        week_number: weekNumber,
        themes: result.themes,
        depth_score: result.depth_score,
        shift_detected: result.shift_detected,
        shift_description: result.shift_description,
        daily_hint: result.daily_hint,
        weekly_summary: result.weekly_summary,
        raw_ai_response: parsed,
      });

      if (insertErr) {
        console.error(`Insert failed for ${answer.user_id}:`, insertErr);
        results.push({ user_id: answer.user_id, ok: false, error: "insert_failed" });
      } else {
        results.push({ user_id: answer.user_id, ok: true });
      }
    } catch (err) {
      console.error(`Error analyzing ${answer.user_id}:`, err);
      results.push({ user_id: answer.user_id, ok: false, error: "unexpected" });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({
    ok: true,
    cycleDay,
    hijri: `${hijri.year}-${hijri.month}-${hijri.day}`,
    total: todayAnswers.length,
    succeeded,
    failed,
    details: results,
  });
}
