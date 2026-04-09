/**
 * Timeline composer — the unified spine.
 *
 * V10 layer on top of V9 Journey Memory. Merges raw facts from independent
 * sources (reflections table + progress.completed_days + optional V9
 * completedSteps) into a single chronological journey, grouped by phase.
 *
 * This is the module that fixes: "I reached day 6 but الدفتر doesn't show it".
 *
 * Before: /progress only read `reflections` rows → day completions without
 *         written notes never appeared.
 * After:  /progress calls buildTimeline() which merges every source that
 *         knows about day activity. Every lived moment appears, with or
 *         without a written note.
 *
 * Pure module — no IO, no React, no network. Works identically on server
 * (API route) and client (guest/offline fallback).
 */

import type { JourneyPhase } from "./memory";
import { phaseFromDay } from "./memory";

export type FactKind =
  | "day_completion"
  | "reflection"
  | "day_completion_with_reflection";

export interface JourneyFact {
  /** Stable id within the timeline: "day-6". */
  id: string;
  /** 1..28 */
  day: number;
  /** Which phase this day belongs to. */
  phase: JourneyPhase;
  /** What this fact represents. */
  kind: FactKind;
  /** Whether the day was marked completed in any completion source. */
  completed: boolean;
  /** User's written reflection, if any. */
  note: string | null;
  /** Theme label pulled from taamun-28days content, if available. */
  theme: string | null;
  /** Ayah text for this day, if available. */
  verseArabic: string | null;
  /** ISO timestamp — best available: reflection.updated_at or synthetic. */
  timestamp: string;
  /** A single short Arabic sentence describing the fact as story, not checklist. */
  sentence: string;
}

export interface TimelineInput {
  reflections: Array<{
    day: number;
    note: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  }>;
  /** From progress.completed_days (server) or loadProgress entries (client). */
  completedDays: number[];
  /**
   * Optional: V9 journey_state.completedSteps like ["day_1","day_6"].
   * Parsed here and merged into completedDays.
   */
  completedSteps?: string[];
  /** Optional: day -> { theme, verseArabic } enrichment. */
  dayMeta?: Record<number, { theme?: string | null; verseArabic?: string | null }>;
}

export interface PhaseSection {
  phase: JourneyPhase;
  facts: JourneyFact[];
  reached: boolean;
  completedCount: number;
  insightCount: number;
  summary: string;
}

export interface Timeline {
  facts: JourneyFact[];
  sections: PhaseSection[];
  totals: {
    completedDays: number;
    reflections: number;
    lastActiveDay: number;
  };
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function cleanNote(note: string | null | undefined): string | null {
  if (!note) return null;
  const trimmed = String(note).trim();
  return trimmed.length ? trimmed : null;
}

function extractDayFromStep(step: string): number | null {
  const match = /^day_(\d+)$/.exec(step);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isInteger(n) || n < 1 || n > 28) return null;
  return n;
}

function sentenceFor(
  day: number,
  kind: FactKind,
  note: string | null,
  theme: string | null
): string {
  const themeSuffix = theme ? ` — ${theme}` : "";

  if (kind === "day_completion_with_reflection" && note) {
    const snippet = note.length > 80 ? `${note.slice(0, 80).trim()}…` : note;
    return `يوم ${day}${themeSuffix}: كتبت "${snippet}"`;
  }
  if (kind === "reflection" && note) {
    const snippet = note.length > 80 ? `${note.slice(0, 80).trim()}…` : note;
    return `يوم ${day}${themeSuffix}: تأمّل — "${snippet}"`;
  }
  if (kind === "day_completion") {
    return `يوم ${day}${themeSuffix}: خطوة مكتملة في صمت.`;
  }
  return `يوم ${day}${themeSuffix}.`;
}

function phaseSummary(section: Omit<PhaseSection, "summary">): string {
  if (!section.reached) return "لم تصل إلى هذه المرحلة بعد.";
  if (section.completedCount === 0 && section.insightCount === 0) {
    return "بدأت الاقتراب — لم تُسجَّل لحظات بعد.";
  }

  const parts: string[] = [];
  if (section.completedCount > 0) parts.push(`${section.completedCount} يوم مكتمل`);
  if (section.insightCount > 0) parts.push(`${section.insightCount} تأمّل مكتوب`);
  return parts.join(" · ");
}

// ---------------------------------------------------------------------------
// Core merge
// ---------------------------------------------------------------------------

/**
 * Merge reflections + completed days (+ V9 completedSteps) into a single
 * ordered timeline.
 *
 * Rules:
 * - If a day appears in both lists → kind = day_completion_with_reflection
 * - If only in completed_days → kind = day_completion (no note)
 * - If only in reflections → kind = reflection (written but not marked complete)
 * - Days are unique: 1..28
 */
export function buildTimeline(input: TimelineInput): Timeline {
  const byDay = new Map<number, JourneyFact>();

  // Index reflections by day
  const reflectionByDay = new Map<number, TimelineInput["reflections"][number]>();
  for (const r of input.reflections) {
    if (!Number.isInteger(r.day)) continue;
    if (r.day < 1 || r.day > 28) continue;
    reflectionByDay.set(r.day, r);
  }

  // Union of completed days from both sources
  const completed = new Set<number>();
  for (const d of input.completedDays) {
    if (Number.isInteger(d) && d >= 1 && d <= 28) completed.add(d);
  }
  for (const step of input.completedSteps ?? []) {
    const d = extractDayFromStep(step);
    if (d !== null) completed.add(d);
  }

  // Union of all days referenced anywhere
  const allDays = new Set<number>([
    ...reflectionByDay.keys(),
    ...completed,
  ]);

  for (const day of allDays) {
    const reflection = reflectionByDay.get(day);
    const isCompleted = completed.has(day);
    const note = cleanNote(reflection?.note ?? null);
    const meta = input.dayMeta?.[day];
    const theme = meta?.theme ?? null;
    const verseArabic = meta?.verseArabic ?? null;

    let kind: FactKind;
    if (isCompleted && note) kind = "day_completion_with_reflection";
    else if (isCompleted) kind = "day_completion";
    else kind = "reflection";

    const timestamp =
      reflection?.updated_at ?? reflection?.created_at ?? new Date().toISOString();

    byDay.set(day, {
      id: `day-${day}`,
      day,
      phase: phaseFromDay(day),
      kind,
      completed: isCompleted,
      note,
      theme,
      verseArabic,
      timestamp,
      sentence: sentenceFor(day, kind, note, theme),
    });
  }

  const facts = Array.from(byDay.values()).sort((a, b) => a.day - b.day);

  // Build phase sections
  const phases: JourneyPhase[] = ["entry", "deepening", "integrating", "mastery"];
  const lastActiveDay = facts.length ? facts[facts.length - 1].day : 0;

  const sections: PhaseSection[] = phases.map((phase) => {
    const phaseFacts = facts.filter((f) => f.phase === phase);
    const completedCount = phaseFacts.filter((f) => f.completed).length;
    const insightCount = phaseFacts.filter((f) => f.note !== null).length;
    const reached = phaseFacts.length > 0;

    const base = { phase, facts: phaseFacts, reached, completedCount, insightCount };
    return { ...base, summary: phaseSummary(base) };
  });

  return {
    facts,
    sections,
    totals: {
      completedDays: completed.size,
      reflections: reflectionByDay.size,
      lastActiveDay,
    },
  };
}
