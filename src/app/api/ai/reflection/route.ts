/**
 * POST /api/ai/reflection
 *
 * Phase 4 · Task 1 — AI Reflection Engine (public endpoint).
 * Phase 4 · Task 2 — refactored to use shared lib so /api/reflections
 * POST can invoke the same analyzer without duplicating the prompt.
 *
 * This route exists as a stand-alone endpoint for:
 *   - Direct client calls (if a future hook wants synchronous AI)
 *   - Debug/testing tools
 *   - Any future caller that wants AI without the save path
 *
 * The actual AI logic lives in src/lib/ai/analyzeReflection.ts.
 * This file is now a thin HTTP adapter: parse body, auth, call lib,
 * format response.
 *
 * Auth: requireUser (consistent with /api/reflections).
 */

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { analyzeReflection } from "@/lib/ai/analyzeReflection";
import { ensureUserProgress } from "@/lib/progressStore";
import { orchestrate } from "@/lib/ai/orchestrate";
import { computeBehavioralSignals } from "@/lib/ai/signals";
import {
  buildFingerprint,
  fingerprintToPromptBlock,
} from "@/lib/ai/memoryEvolution";
import { evaluateFeedbackLoop } from "@/lib/ai/feedbackLoop";
import {
  fetchRecentReflections,
  compressToPromptContext,
} from "@/lib/ai/memory";
import type { ReflectionForAnalysis } from "@/lib/ai/patterns";

export const dynamic = "force-dynamic";

type RequestBody = {
  text?: unknown;
  day?: unknown;
};

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const day = Number(body.day);

  if (!text) {
    return NextResponse.json({ ok: false, error: "text_missing" }, { status: 400 });
  }
  if (text.length < 3) {
    return NextResponse.json({ ok: false, error: "text_too_short" }, { status: 400 });
  }
  if (!Number.isInteger(day) || day < 1 || day > 28) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  // System Activation: build full intelligence context for the AI.
  // All from DB — zero localStorage. Progressive: if any step fails,
  // the analyzer still works in single-shot mode.
  let aiContext: Parameters<typeof analyzeReflection>[2] = undefined;
  try {
    // Fetch recent reflections + progress for context
    const [recentRows, progress] = await Promise.all([
      fetchRecentReflections(auth.supabase, auth.user.id, {
        excludeDay: day,
        limit: 10,
      }),
      ensureUserProgress(auth.supabase, auth.user.id),
    ]);

    if (progress.ok && recentRows.length > 0) {
      // Memory block
      const memoryCtx = compressToPromptContext(recentRows.slice(0, 4));

      // Orchestrate for tone
      const orch = orchestrate({
        currentDay: progress.currentDay,
        completedDays: progress.completedDays,
        reflections: recentRows as ReflectionForAnalysis[],
      });

      // Fingerprint for identity
      const signals = computeBehavioralSignals(
        progress.currentDay,
        progress.completedDays,
        recentRows as ReflectionForAnalysis[]
      );
      const feedback = evaluateFeedbackLoop(
        progress.currentDay,
        progress.completedDays,
        recentRows as ReflectionForAnalysis[]
      );
      const fp = buildFingerprint({
        archetype: orch.profile.behavioralState,
        signals,
        evolution: feedback.stateChange,
        topThemes: orch.profile.patternInsight.recurringThemes
          .slice(0, 3)
          .map((t) => t.theme),
        currentDay: progress.currentDay,
        completedCount: progress.completedDays.length,
      });

      aiContext = {
        toneInstruction: orch.tone.instruction,
        fingerprintBlock: fingerprintToPromptBlock(fp),
        memoryBlock: memoryCtx.promptText,
      };
    }
  } catch {
    // Intelligence is progressive — analyzer works without context
  }

  try {
    const analysis = await analyzeReflection(text, day, aiContext);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // Map known lib errors to sensible HTTP codes
    if (msg === "ai_not_configured") {
      return NextResponse.json(
        { ok: false, error: "ai_not_configured" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "ai_request_failed",
        detail: msg.slice(0, 200),
      },
      { status: 502 }
    );
  }
}
