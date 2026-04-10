/**
 * GET /api/journey/intelligence
 *
 * The unified intelligence endpoint. One call returns everything
 * the AI, City, and Journey layers need to adapt to this user:
 *
 *   - behavioralState + score + engagement
 *   - feedback loop (evolving / regressing / stable + insights)
 *   - fingerprint (compressed identity)
 *   - orchestrator output (nextAction, tone, citySignals)
 *   - prompt blocks (ready to inject into AI calls)
 *
 * Data flow:
 *   1. Read progress from DB (progress table)
 *   2. Read reflections from DB (reflections table)
 *   3. Compute behavioral signals (pure)
 *   4. Run feedback loop (pure)
 *   5. Run orchestrator (pure)
 *   6. Build fingerprint (pure)
 *   7. Return unified output
 *
 * ALL inputs from DB. ALL computations deterministic.
 * Zero localStorage, zero client state, zero side effects.
 */

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { ensureUserProgress } from "@/lib/progressStore";
import { computeBehavioralSignals } from "@/lib/ai/signals";
import { evaluateFeedbackLoop } from "@/lib/ai/feedbackLoop";
import { orchestrate } from "@/lib/ai/orchestrate";
import {
  buildFingerprint,
  fingerprintToPromptBlock,
} from "@/lib/ai/memoryEvolution";
import { mapAwareness } from "@/lib/ai/awarenessLayer";
import type { ReflectionForAnalysis } from "@/lib/ai/patterns";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;

  // 1. Read progress from DB
  const progress = await ensureUserProgress(supabase, user.id);
  if (!progress.ok) {
    return NextResponse.json(
      { ok: false, error: "progress_read_failed" },
      { status: 500 }
    );
  }

  // 2. Read reflections from DB
  const { data: reflectionRows, error: refError } = await supabase
    .from("reflections")
    .select("day, note, ai_sentiment, ai_theme, ai_mirror, updated_at")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  if (refError) {
    return NextResponse.json(
      { ok: false, error: "reflections_read_failed" },
      { status: 500 }
    );
  }

  const reflections: ReflectionForAnalysis[] = (reflectionRows ?? []).map(
    (r) => ({
      day: Number(r.day),
      note: (r.note as string | null) ?? null,
      ai_sentiment: (r.ai_sentiment as string | null) ?? null,
      ai_theme: (r.ai_theme as string | null) ?? null,
      ai_mirror: (r.ai_mirror as string | null) ?? null,
      updated_at: (r.updated_at as string | null) ?? null,
    })
  );

  // 3. Compute behavioral signals
  const signals = computeBehavioralSignals(
    progress.currentDay,
    progress.completedDays,
    reflections
  );

  // 4. Run feedback loop
  const feedback = evaluateFeedbackLoop(
    progress.currentDay,
    progress.completedDays,
    reflections
  );

  // 5. Run orchestrator
  const orch = orchestrate({
    currentDay: progress.currentDay,
    completedDays: progress.completedDays,
    reflections,
  });

  // 6. Build fingerprint
  const topThemes = orch.profile.patternInsight.recurringThemes
    .slice(0, 3)
    .map((t) => t.theme);

  const fingerprint = buildFingerprint({
    archetype: orch.profile.behavioralState,
    signals,
    evolution: feedback.stateChange,
    topThemes,
    currentDay: progress.currentDay,
    completedCount: progress.completedDays.length,
  });

  const fingerprintBlock = fingerprintToPromptBlock(fingerprint);

  // 7. Awareness layer — secondary lens, additive only
  //    Does NOT affect any field above. Safe to remove entirely.
  const awareness = mapAwareness({
    behavioralScore: signals.behavioralScore,
    consistencyIndex: signals.consistencyIndex,
    engagementLevel: signals.engagementLevel,
    avgNoteLength: signals.avgNoteLength,
    stateChange: feedback.stateChange,
    completedCount: progress.completedDays.length,
  });

  // 8. Return unified intelligence output
  return NextResponse.json({
    ok: true,

    // User state
    currentDay: progress.currentDay,
    completedDays: progress.completedDays,
    completedCount: progress.completedDays.length,

    // Behavioral signals (quantified)
    signals: {
      behavioralScore: signals.behavioralScore,
      engagementLevel: signals.engagementLevel,
      consistencyIndex: signals.consistencyIndex,
      completionRate: signals.completionRate,
      reflectionRate: signals.reflectionRate,
      skippedCount: signals.skippedCount,
      avgNoteLength: signals.avgNoteLength,
    },

    // Feedback loop (evolution)
    feedback: {
      stateChange: feedback.stateChange,
      confidence: feedback.confidence,
      insights: feedback.insights,
      summary: feedback.summary,
      currentState: feedback.currentState,
      previousState: feedback.previousState,
    },

    // Orchestrator (adaptive context)
    profile: orch.profile,
    nextAction: orch.nextAction,
    tone: orch.tone,
    citySignals: orch.citySignals,

    // Fingerprint (compressed identity)
    fingerprint,

    // Prompt blocks (ready for AI injection)
    promptBlocks: {
      patterns: orch.aiPatternBlock,
      fingerprint: fingerprintBlock,
    },

    // Awareness layer — secondary Gene Keys lens (additive, non-disruptive)
    awareness,
  });
}
