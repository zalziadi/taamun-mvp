"use client";

/**
 * useSaveReflection — convenience hook for saving a reflection.
 *
 * Phase 4 · Task 2. The AI enhancement itself happens server-side
 * inside /api/reflections POST (fire-and-forget) — any caller that
 * hits the endpoint gets AI automatically. This hook is a thin
 * wrapper that:
 *
 *   1. POSTs to /api/reflections (the existing endpoint)
 *   2. Returns { saving, saved, error, save } for UI convenience
 *   3. Optionally fetches the row back via /api/reflections GET
 *      so UI can show AI fields once they've been persisted.
 *
 * Note on AI availability: the server writes ai_* columns in the
 * background. They typically arrive within 1-3 seconds after save.
 * Callers that want to display the AI insight should either:
 *
 *   a. Call `save()` then `refetchLatest()` after a short delay
 *   b. Poll /api/reflections GET until ai_* fields appear
 *   c. Use the synchronous /api/ai/reflection endpoint directly
 *      (Task 1 route) to bypass the async wait
 *
 * Option (c) is what the Insight Card UI (Task 5) will likely do
 * because it gives an immediate result without a poll loop.
 *
 * This hook does NOT call /api/ai/reflection directly. The server
 * already does that. Duplicating the call here would double the
 * OpenAI spend.
 */

import { useCallback, useState } from "react";

export interface SaveReflectionInput {
  day: number;
  note: string;
  surah?: string;
  ayah?: number | null;
  emotion?: string;
  awareness_state?: "shadow" | "gift" | "best_possibility" | null;
}

export interface SaveReflectionResult {
  ok: boolean;
  day?: number;
  error?: string;
  /** Links + patterns + narrative + action from the cognitive layer. */
  linked?: {
    insight: string;
    connected_days: number[];
    emotional_arc: string;
    patterns: string[];
  };
}

interface UseSaveReflectionResult {
  saving: boolean;
  saved: boolean;
  error: string | null;
  lastResult: SaveReflectionResult | null;
  save: (input: SaveReflectionInput) => Promise<SaveReflectionResult>;
  reset: () => void;
}

export function useSaveReflection(): UseSaveReflectionResult {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SaveReflectionResult | null>(null);

  const save = useCallback(
    async (input: SaveReflectionInput): Promise<SaveReflectionResult> => {
      setSaving(true);
      setSaved(false);
      setError(null);

      try {
        const res = await fetch("/api/reflections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            day: input.day,
            note: input.note,
            ...(input.surah !== undefined && { surah: input.surah }),
            ...(input.ayah !== undefined && { ayah: input.ayah }),
            ...(input.emotion !== undefined && { emotion: input.emotion }),
            ...(input.awareness_state !== undefined && {
              awareness_state: input.awareness_state,
            }),
          }),
        });

        const data = (await res.json()) as SaveReflectionResult;

        if (!res.ok || !data.ok) {
          const msg = data.error ?? "save_failed";
          setError(msg);
          setLastResult(data);
          setSaved(false);
          return data;
        }

        setLastResult(data);
        setSaved(true);
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "network_error";
        setError(msg);
        setSaved(false);
        return { ok: false, error: msg };
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setSaving(false);
    setSaved(false);
    setError(null);
    setLastResult(null);
  }, []);

  return {
    saving,
    saved,
    error,
    lastResult,
    save,
    reset,
  };
}
