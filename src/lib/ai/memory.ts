/**
 * AI Memory Layer — personal, per-user reflection context.
 *
 * Phase 5 (memory) · built on top of the existing Supabase `reflections`
 * table. No new DB schema. Zero migrations. This module just reads
 * from rows that already exist and compresses them into a small text
 * block that the analyzer can inject into the prompt.
 *
 * Why this exists:
 *   Before this layer, /api/ai/reflection saw only the current text.
 *   Each mirror was a snapshot of one isolated moment. Memory adds
 *   the "I see you over time" quality without storing anything
 *   beyond what's already in `reflections`.
 *
 * What this layer is NOT:
 *   - Not a vector DB / embeddings (not needed for this scale)
 *   - Not cross-user learning (this is personal memory only)
 *   - Not a soul summary generator (that's a future task — this
 *     module only fetches raw recent rows and compresses them)
 *   - Not persisted beyond the session — every request fetches fresh
 *
 * Pure module: takes a Supabase client and a userId, returns data.
 * No cookies, no server actions, no side effects.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A reflection row as projected for memory use. Lean — we only need
 * what the analyzer cares about for context.
 */
export interface MemoryReflectionRow {
  day: number;
  note: string | null;
  ai_sentiment: string | null;
  ai_theme: string | null;
  ai_mirror: string | null;
  updated_at: string | null;
}

export interface FetchRecentOptions {
  /** Max rows to return. Default 5, capped at 10. */
  limit?: number;
  /** Exclude this day (useful when analyzing day N to avoid feeding it its own row). */
  excludeDay?: number;
  /** Only include rows that have non-empty note text. Default true. */
  requireNote?: boolean;
}

/**
 * The compressed memory block the analyzer injects into the prompt.
 * Small, human-readable Arabic. Never includes user IDs or metadata
 * that the model doesn't need.
 */
export interface MemoryContext {
  /** The prompt-ready Arabic block. Empty string if no usable history. */
  promptText: string;
  /** How many rows contributed to the block. */
  rowCount: number;
  /** The days included (for debug/logging). */
  days: number[];
}

// ---------------------------------------------------------------------------
// Fetch — uses the caller's Supabase client (RLS-enforced)
// ---------------------------------------------------------------------------

/**
 * Fetch the user's most recent reflections. Ordered by updated_at DESC
 * so the newest revision of each day wins.
 *
 * Safe to call with either the cookie-authenticated server client OR
 * the admin client. The WHERE clause on user_id is explicit so RLS
 * bypass (admin) still scopes results to the target user.
 */
export async function fetchRecentReflections(
  supabase: SupabaseClient,
  userId: string,
  options: FetchRecentOptions = {}
): Promise<MemoryReflectionRow[]> {
  const limit = Math.min(Math.max(1, options.limit ?? 5), 10);
  const requireNote = options.requireNote !== false;

  let query = supabase
    .from("reflections")
    .select("day, note, ai_sentiment, ai_theme, ai_mirror, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit * 2); // fetch a bit extra so we can filter client-side

  if (typeof options.excludeDay === "number") {
    query = query.neq("day", options.excludeDay);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  const rows = data as MemoryReflectionRow[];

  const filtered = requireNote
    ? rows.filter((r) => typeof r.note === "string" && r.note.trim().length > 0)
    : rows;

  return filtered.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Compress — turn rows into a short Arabic prompt block
// ---------------------------------------------------------------------------

/**
 * Compress a handful of recent reflections into a short Arabic block
 * suitable for injecting into the analyzer's user prompt.
 *
 * Format (hand-tuned for gpt-4o-mini token budget and voice):
 *
 *   "في الأيام السابقة كتبت ما يلي:
 *    · يوم 3 (مقاومة · الضغط والتردد): "أوّل ٥٠ حرفاً..."
 *    · يوم 5 (انفتاح · ملاحظة هادئة): "أوّل ٥٠ حرفاً..."
 *    · يوم 6 : "أوّل ٥٠ حرفاً..."  (لو ما كان فيه ai_*)
 *   "
 *
 * Design choices:
 *   - Sorted ascending by day (chronological) so the model reads them
 *     as a story, not a list of snapshots.
 *   - Max 50 chars per note preview — enough signal, small footprint.
 *   - sentiment + theme inlined in Arabic when available, hidden
 *     otherwise (no empty brackets).
 *   - Hard cap of ~500 chars total — prevents the context block from
 *     dominating the prompt.
 */
export function compressToPromptContext(
  rows: MemoryReflectionRow[]
): MemoryContext {
  if (rows.length === 0) {
    return { promptText: "", rowCount: 0, days: [] };
  }

  // Sort ascending by day for chronological narrative
  const sorted = [...rows].sort((a, b) => a.day - b.day);

  const lines: string[] = ["في الأيام السابقة كتبتَ ما يلي:"];
  const days: number[] = [];

  for (const row of sorted) {
    const note = (row.note ?? "").trim();
    if (!note) continue;

    const preview =
      note.length > 50 ? `${note.slice(0, 50).trim()}…` : note;

    const tags = buildTags(row);
    const line = tags
      ? `· يوم ${row.day} (${tags}): "${preview}"`
      : `· يوم ${row.day}: "${preview}"`;

    lines.push(line);
    days.push(row.day);
  }

  if (days.length === 0) {
    return { promptText: "", rowCount: 0, days: [] };
  }

  let promptText = lines.join("\n");

  // Hard cap — keep memory from dominating the prompt
  const MAX_CONTEXT_CHARS = 500;
  if (promptText.length > MAX_CONTEXT_CHARS) {
    promptText = promptText.slice(0, MAX_CONTEXT_CHARS).trimEnd() + "…";
  }

  return { promptText, rowCount: days.length, days };
}

function buildTags(row: MemoryReflectionRow): string {
  const parts: string[] = [];

  if (row.ai_sentiment) {
    parts.push(arabicSentiment(row.ai_sentiment));
  }
  if (row.ai_theme) {
    parts.push(row.ai_theme);
  }

  return parts.join(" · ");
}

function arabicSentiment(raw: string): string {
  switch (raw) {
    case "resistant":
      return "مقاومة";
    case "open":
      return "انفتاح";
    case "neutral":
      return "حياد";
    default:
      return raw;
  }
}

// ---------------------------------------------------------------------------
// High-level convenience — one call to get the ready-to-inject context
// ---------------------------------------------------------------------------

/**
 * Single entry point for routes: fetch + compress in one call.
 * Returns an empty MemoryContext on any failure (fault-tolerant).
 */
export async function buildMemoryContext(
  supabase: SupabaseClient,
  userId: string,
  options: FetchRecentOptions = {}
): Promise<MemoryContext> {
  try {
    const rows = await fetchRecentReflections(supabase, userId, options);
    return compressToPromptContext(rows);
  } catch {
    return { promptText: "", rowCount: 0, days: [] };
  }
}
