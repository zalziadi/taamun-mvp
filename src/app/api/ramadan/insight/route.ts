import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { APP_NAME, RAMADAN_PROGRAM_KEY } from "@/lib/appConfig";

export const dynamic = "force-dynamic";

const PROGRAM_KEY = RAMADAN_PROGRAM_KEY;
const PROGRAM_VERSION = 1;
const CACHE_WINDOW_MS = 24 * 60 * 60 * 1000;

type InsightMode = "weekly" | "final";

type InsightBase = {
  dominantPattern: string;
  shadow: string;
  gift: string;
  bestPotential: string;
  advice: string;
  clarityScore: number;
  responsibilityScore: number;
  trustScore: number;
  surrenderScore: number;
  confidence: number;
};

type EvolutionPoint = {
  week: number;
  clarityScore: number;
  responsibilityScore: number;
  trustScore: number;
  surrenderScore: number;
};

type InsightFinal = InsightBase & {
  evolution: EvolutionPoint[];
  transformationSummary: string;
};

type JournalRow = {
  day: number;
  observe_text: string | null;
  insight_text: string | null;
  contemplate_text: string | null;
  rebuild_text: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toInt100(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(Math.round(n), 0, 100);
}

function toConfidence(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return clamp(Number(n.toFixed(2)), 0, 1);
}

function asText(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    // continue
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]) as Record<string, unknown>;
    } catch {
      // continue
    }
  }

  const start = trimmed.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0) {
      const candidate = trimmed.slice(start, i + 1);
      try {
        return JSON.parse(candidate) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function toWeeklyRanges(week: number): { fromDay: number; toDay: number } {
  const fromDay = (week - 1) * 7 + 1;
  return { fromDay, toDay: fromDay + 6 };
}

function summarizeWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function heuristicInsight(rows: JournalRow[], mode: InsightMode): InsightBase {
  const joined = rows
    .map(
      (r) =>
        `${r.observe_text ?? ""} ${r.insight_text ?? ""} ${r.contemplate_text ?? ""} ${r.rebuild_text ?? ""}`
    )
    .join(" ");
  const tokenCount = joined.trim().length;
  const depth = clamp(Math.round((tokenCount / Math.max(rows.length, 1)) / 5), 20, 95);
  const clarity = clamp(depth + (rows.length >= 4 ? 5 : -5), 0, 100);
  const responsibility = clamp(
    depth + (rows.some((r) => (r.rebuild_text ?? "").trim()) ? 8 : -8),
    0,
    100
  );
  const trust = clamp(depth - 2, 0, 100);
  const surrender = clamp(depth - 4, 0, 100);

  return {
    dominantPattern: mode === "final" ? "نضج تدريجي عبر الانضباط اليومي" : "تراكم وعي يومي متدرج",
    shadow: "التشتت والاندفاع قبل تثبيت معنى اليوم.",
    gift: "القدرة على تحويل الملاحظة إلى إدراك عملي.",
    bestPotential: "الاستمرار الهادئ سيحوّل الإدراك إلى عادة راسخة.",
    advice: "اختر فعلًا صغيرًا ثابتًا كل يوم، وراجع أثره قبل النوم.",
    clarityScore: clarity,
    responsibilityScore: responsibility,
    trustScore: trust,
    surrenderScore: surrender,
    confidence: rows.length >= 4 ? 0.78 : 0.62,
  };
}

function normalizeInsightBase(payload: Record<string, unknown>, fallback: InsightBase): InsightBase {
  return {
    dominantPattern: asText(payload.dominantPattern, fallback.dominantPattern),
    shadow: asText(payload.shadow, fallback.shadow),
    gift: asText(payload.gift, fallback.gift),
    bestPotential: asText(payload.bestPotential, fallback.bestPotential),
    advice: asText(payload.advice, fallback.advice),
    clarityScore: toInt100(payload.clarityScore ?? fallback.clarityScore),
    responsibilityScore: toInt100(payload.responsibilityScore ?? fallback.responsibilityScore),
    trustScore: toInt100(payload.trustScore ?? fallback.trustScore),
    surrenderScore: toInt100(payload.surrenderScore ?? fallback.surrenderScore),
    confidence: toConfidence(payload.confidence ?? fallback.confidence),
  };
}

function normalizeEvolution(value: unknown, fallback: EvolutionPoint[]): EvolutionPoint[] {
  if (!Array.isArray(value)) return fallback;
  const out = value
    .map((row) => {
      const obj = row as Record<string, unknown>;
      return {
        week: clamp(Number(obj.week ?? 0), 1, 4),
        clarityScore: toInt100(obj.clarityScore),
        responsibilityScore: toInt100(obj.responsibilityScore),
        trustScore: toInt100(obj.trustScore),
        surrenderScore: toInt100(obj.surrenderScore),
      };
    })
    .filter((p) => Number.isInteger(p.week))
    .sort((a, b) => a.week - b.week);

  if (out.length === 0) return fallback;
  const uniqueByWeek = new Map<number, EvolutionPoint>();
  for (const point of out) uniqueByWeek.set(point.week, point);
  return [1, 2, 3, 4]
    .map((week) => uniqueByWeek.get(week))
    .filter(Boolean) as EvolutionPoint[];
}

async function callAnthropic(prompt: string) {
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
      max_tokens: 900,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content?.find((item) => item.type === "text")?.text;
  return text?.trim() || null;
}

function buildPrompt(args: {
  mode: InsightMode;
  week?: number;
  rows: JournalRow[];
}) {
  const rangeLabel =
    args.mode === "weekly" && args.week
      ? `الأسبوع ${args.week} (${toWeeklyRanges(args.week).fromDay}-${toWeeklyRanges(args.week).toDay})`
      : "البرنامج كامل (1-28)";
  const dataset = args.rows
    .map(
      (r) =>
        `Day ${r.day}\nobserve: ${r.observe_text ?? ""}\ninsight: ${r.insight_text ?? ""}\ncontemplate: ${
          r.contemplate_text ?? ""
        }\nrebuild: ${r.rebuild_text ?? ""}`
    )
    .join("\n\n");

  const finalExtra =
    args.mode === "final"
      ? `, "evolution":[{"week":1,"clarityScore":0,"responsibilityScore":0,"trustScore":0,"surrenderScore":0},{"week":2,"clarityScore":0,"responsibilityScore":0,"trustScore":0,"surrenderScore":0},{"week":3,"clarityScore":0,"responsibilityScore":0,"trustScore":0,"surrenderScore":0},{"week":4,"clarityScore":0,"responsibilityScore":0,"trustScore":0,"surrenderScore":0}], "transformationSummary":"..."`
      : "";

  return [
    `أنت محلل نفسي سلوكي لبرنامج ${APP_NAME} الرمضاني.`,
    `المجال: ${rangeLabel}.`,
    "المطلوب: أعد JSON فقط بدون أي نص إضافي أو markdown.",
    `المفاتيح المطلوبة: {"dominantPattern":"...","shadow":"...","gift":"...","bestPotential":"...","advice":"...","clarityScore":0,"responsibilityScore":0,"trustScore":0,"surrenderScore":0,"confidence":0.0${finalExtra}}`,
    "الدرجات أعداد صحيحة 0..100، confidence رقم 0..1.",
    "اللغة: عربية واضحة ومختصرة.",
    "البيانات:",
    dataset || "لا توجد إدخالات.",
  ].join("\n");
}

function buildCachedResponse(
  row: Record<string, unknown>,
  mode: InsightMode,
  weeklyEvolution: EvolutionPoint[]
) {
  const insight: InsightBase = {
    dominantPattern: String(row.dominant_pattern ?? ""),
    shadow: String(row.shadow ?? ""),
    gift: String(row.gift ?? ""),
    bestPotential: String(row.best_potential ?? ""),
    advice: String(row.advice ?? ""),
    clarityScore: toInt100(row.clarity_score),
    responsibilityScore: toInt100(row.responsibility_score),
    trustScore: toInt100(row.trust_score),
    surrenderScore: toInt100(row.surrender_score),
    confidence: toConfidence(row.confidence),
  };

  if (mode === "final") {
    const rowEvolution = normalizeEvolution(
      row.evolution,
      weeklyEvolution.length > 0 ? weeklyEvolution : []
    );
    const finalInsight: InsightFinal = {
      ...insight,
      evolution: rowEvolution,
      transformationSummary: summarizeWords(String(row.transformation_summary ?? insight.advice), 120),
    };
    return finalInsight;
  }
  return insight;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { mode?: InsightMode; week?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const mode = body.mode;
  if (mode !== "weekly" && mode !== "final") {
    return NextResponse.json({ ok: false, error: "invalid_mode" }, { status: 400 });
  }

  const weekNumber = mode === "weekly" ? Number(body.week) : undefined;
  if (
    mode === "weekly" &&
    (!Number.isInteger(weekNumber) || (weekNumber as number) < 1 || (weekNumber as number) > 4)
  ) {
    return NextResponse.json({ ok: false, error: "invalid_week" }, { status: 400 });
  }

  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "true";
  const cacheOnly = url.searchParams.get("cacheOnly") === "true";

  let resolvedCached: Record<string, unknown> | null = null;
  if (mode === "weekly") {
    const weeklyCached = await supabase
      .from("ramadan_insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("program_key", PROGRAM_KEY)
      .eq("version", PROGRAM_VERSION)
      .eq("type", "weekly")
      .eq("week", weekNumber as number)
      .maybeSingle();
    resolvedCached = (weeklyCached.data as Record<string, unknown> | null) ?? null;
  } else {
    const finalCached = await supabase
      .from("ramadan_insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("program_key", PROGRAM_KEY)
      .eq("version", PROGRAM_VERSION)
      .eq("type", "final")
      .is("week", null)
      .maybeSingle();
    resolvedCached = (finalCached.data as Record<string, unknown> | null) ?? null;
  }

  const weeklyForEvolutionRes = await supabase
    .from("ramadan_insights")
    .select("week, clarity_score, responsibility_score, trust_score, surrender_score")
    .eq("user_id", user.id)
    .eq("program_key", PROGRAM_KEY)
    .eq("version", PROGRAM_VERSION)
    .eq("type", "weekly")
    .order("week", { ascending: true });

  const weeklyEvolution: EvolutionPoint[] = (weeklyForEvolutionRes.data ?? [])
    .map((row) => ({
      week: clamp(Number(row.week ?? 0), 1, 4),
      clarityScore: toInt100(row.clarity_score),
      responsibilityScore: toInt100(row.responsibility_score),
      trustScore: toInt100(row.trust_score),
      surrenderScore: toInt100(row.surrender_score),
    }))
    .filter((row) => Number.isInteger(row.week));

  if (!refresh && resolvedCached?.created_at) {
    const age = Date.now() - new Date(String(resolvedCached.created_at)).getTime();
    if (age <= CACHE_WINDOW_MS) {
      return NextResponse.json({
        ok: true,
        insight: buildCachedResponse(resolvedCached, mode, weeklyEvolution),
        cached: true,
      });
    }
  }

  if (cacheOnly) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  let query = supabase
    .from("ramadan_responses")
    .select("day, observe_text, insight_text, contemplate_text, rebuild_text")
    .eq("user_id", user.id)
    .eq("program_key", PROGRAM_KEY)
    .eq("version", PROGRAM_VERSION)
    .order("day", { ascending: true });

  if (mode === "weekly") {
    const range = toWeeklyRanges(weekNumber as number);
    query = query.gte("day", range.fromDay).lte("day", range.toDay);
  } else {
    query = query.gte("day", 1).lte("day", 28);
  }

  const { data: rows, error: rowsError } = await query;
  if (rowsError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const sourceRows = (rows ?? []) as JournalRow[];
  const fallback = heuristicInsight(sourceRows, mode);
  const prompt = buildPrompt({ mode, week: weekNumber, rows: sourceRows });
  const aiRaw = await callAnthropic(prompt);
  const parsed = aiRaw ? extractJsonObject(aiRaw) : null;
  const base = normalizeInsightBase(parsed ?? {}, fallback);

  let finalInsight: InsightBase | InsightFinal = base;
  if (mode === "final") {
    const fallbackEvolution: EvolutionPoint[] =
      weeklyEvolution.length > 0
        ? weeklyEvolution
        : [1, 2, 3, 4].map((w) => ({
            week: w,
            clarityScore: base.clarityScore,
            responsibilityScore: base.responsibilityScore,
            trustScore: base.trustScore,
            surrenderScore: base.surrenderScore,
          }));
    const evolution = normalizeEvolution(parsed?.evolution, fallbackEvolution);
    const summaryRaw = asText(parsed?.transformationSummary, base.advice);
    finalInsight = {
      ...base,
      evolution,
      transformationSummary: summarizeWords(summaryRaw, 120),
    };
  }

  if (mode === "weekly") {
    const generatedAt = new Date().toISOString();
    const payload = {
      user_id: user.id,
      program_key: PROGRAM_KEY,
      version: PROGRAM_VERSION,
      type: "weekly",
      week: weekNumber as number,
      dominant_pattern: base.dominantPattern,
      shadow: base.shadow,
      gift: base.gift,
      best_potential: base.bestPotential,
      advice: base.advice,
      clarity_score: base.clarityScore,
      responsibility_score: base.responsibilityScore,
      trust_score: base.trustScore,
      surrender_score: base.surrenderScore,
      confidence: base.confidence,
      evolution: null,
      transformation_summary: null,
      created_at: generatedAt,
    };
    const { error } = await supabase
      .from("ramadan_insights")
      .upsert(payload, { onConflict: "user_id,program_key,version,type,week" });
    if (error) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  } else {
    const existing = await supabase
      .from("ramadan_insights")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_key", PROGRAM_KEY)
      .eq("version", PROGRAM_VERSION)
      .eq("type", "final")
      .is("week", null)
      .maybeSingle();

    const final = finalInsight as InsightFinal;
    const generatedAt = new Date().toISOString();
    const payload = {
      user_id: user.id,
      program_key: PROGRAM_KEY,
      version: PROGRAM_VERSION,
      type: "final",
      week: null,
      dominant_pattern: base.dominantPattern,
      shadow: base.shadow,
      gift: base.gift,
      best_potential: base.bestPotential,
      advice: base.advice,
      clarity_score: base.clarityScore,
      responsibility_score: base.responsibilityScore,
      trust_score: base.trustScore,
      surrender_score: base.surrenderScore,
      confidence: base.confidence,
      evolution: final.evolution,
      transformation_summary: final.transformationSummary,
      created_at: generatedAt,
    };

    if (existing.data?.id) {
      const { error } = await supabase
        .from("ramadan_insights")
        .update(payload)
        .eq("id", existing.data.id);
      if (error) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    } else {
      const { error } = await supabase.from("ramadan_insights").insert(payload);
      if (error) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    insight: finalInsight,
    cached: false,
  });
}
