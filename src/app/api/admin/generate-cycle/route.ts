import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateDayContent, getThemeForCycle } from "@/lib/ai-cycle-generator";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // AI generation can take time

/**
 * POST /api/admin/generate-cycle
 *
 * Batch-generates a full 28-day cycle using Claude AI.
 * Skips days that already exist in ai_generated_days.
 *
 * Protected by ADMIN_MIGRATION_KEY / SUPABASE_SERVICE_ROLE_KEY.
 *
 * Body: { cycle: number, days?: number[] }
 *   cycle: which cycle to generate (must be >= 4)
 *   days: optional — only generate specific days (default: all 28)
 *
 * Cost: ~28 * $0.003 ≈ $0.08 per full cycle (claude-sonnet-4 pricing)
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    key?: string;
    cycle?: number;
    days?: number[];
  };

  const expectedKey = process.env.ADMIN_MIGRATION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!body.key || body.key !== expectedKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cycle = body.cycle ?? 4;
  if (cycle < 4) {
    return NextResponse.json(
      { error: "invalid_cycle", hint: "cycle must be >= 4 (cycles 1-3 are hardcoded)" },
      { status: 400 }
    );
  }

  const theme = getThemeForCycle(cycle);
  const daysToGenerate = body.days ?? Array.from({ length: 28 }, (_, i) => i + 1);

  const admin = getSupabaseAdmin();

  // Check which days already exist
  const { data: existing } = await admin
    .from("ai_generated_days")
    .select("day")
    .eq("cycle", cycle);
  const existingDays = new Set((existing ?? []).map((r) => r.day as number));

  const results = {
    cycle,
    theme: theme.name,
    total_requested: daysToGenerate.length,
    skipped_existing: 0,
    generated: 0,
    failed: [] as number[],
  };

  for (const day of daysToGenerate) {
    if (existingDays.has(day)) {
      results.skipped_existing++;
      continue;
    }

    const content = await generateDayContent({ cycle, day, theme });

    if (!content) {
      results.failed.push(day);
      continue;
    }

    const { error } = await admin.from("ai_generated_days").insert({
      cycle,
      day: content.day,
      title: content.title,
      chapter: content.chapter,
      verse: content.verse,
      verse_ref: content.verseRef,
      silence_prompt: content.silencePrompt,
      question: content.question,
      exercise: content.exercise,
      hidden_layer: content.hiddenLayer,
      book_quote: content.bookQuote,
      book_chapter: content.bookChapter,
      model_used: process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-4-20250514",
      theme_name: theme.name,
    });

    if (error) {
      results.failed.push(day);
      continue;
    }

    results.generated++;
  }

  return NextResponse.json({
    ok: results.failed.length === 0,
    ...results,
  });
}
