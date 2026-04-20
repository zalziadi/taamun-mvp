/**
 * Phase 11 — Year-in-Review type-split privacy library.
 *
 * This file is the COMPILE-TIME enforcement of Phase 11's privacy contract
 * (REQ YIR-08, YIR-11; PITFALL #10).
 *
 *   - Public stats : safe to render in share card / OG image / email. ONLY
 *                    counts, averages, badge codes, ISO timestamps, and
 *                    pre-aggregated number arrays. ZERO user text.
 *   - Private body : user-authored reflection text, emotion labels, guide
 *                    messages. FORBIDDEN on any outbound surface.
 *
 * The two interfaces are KEY-DISJOINT. Plan 11.06 imports ONLY the public
 * interface into `src/app/year-in-review/og/route.tsx`. Plan 11.07 adds a
 * grep guard that fails CI if the private-body identifier ever appears in
 * that file.
 *
 * The public interface mirrors the jsonb shape returned by the
 * `get_year_in_review` Postgres RPC (Plan 11.01). Keep the two in sync — if
 * the RPC adds a field, update this type AND the sparkline renderer
 * (Plan 11.05).
 *
 * No runtime imports. Pure types + one regex + one narrow type guard.
 * Zero new dependencies (NFR-08).
 */

// -----------------------------------------------------------------------------
// Public: safe for outbound surfaces
// -----------------------------------------------------------------------------

/**
 * Aggregate stats SAFE for outbound surfaces (share card, OG image, email).
 *
 * Contains ZERO user-authored content — only counts, averages, badge codes
 * (public identifiers), ISO 8601 timestamps, and a pre-aggregated number
 * array for the sparkline.
 *
 * Shape mirrors the jsonb returned by `get_year_in_review(user_id, year_key)`
 * in `supabase/migrations/*_v1_2_year_reviews.sql` (Plan 11.01).
 */
export interface YIRPublicStats {
  readonly reflections_count: number;
  readonly awareness_avg: number | null;
  /** Milestone badge codes (public identifiers, e.g. "first_reflection"). */
  readonly milestones_reached: readonly string[];
  readonly cycle_count: number;
  /** ISO 8601 — null when the user has zero reflections. */
  readonly earliest_reflection_at: string | null;
  /** ISO 8601 — null when the user has zero reflections. */
  readonly latest_reflection_at: string | null;
  /** Up to ~52 weekly awareness averages for the sparkline. */
  readonly awareness_trajectory: readonly number[];
}

// -----------------------------------------------------------------------------
// Private: NEVER safe for outbound surfaces
// -----------------------------------------------------------------------------

/**
 * User-authored content — NEVER safe to ship outbound.
 *
 * Exists as a TYPE ONLY to make accidental bleed a compile error. No code
 * should construct this, pass it to any route handler, or hand it to the
 * `next/og` image renderer.
 *
 * The `/og/route.tsx` grep guard in Plan 11.07 will fail CI if this
 * identifier ever appears inside that file.
 *
 * Key-disjoint from `YIRPublicStats` by construction (see types.test.ts
 * for the `Equal<Extract<...>, never>` assertion).
 */
export interface YIRPrivateContent {
  readonly reflection_text: string;
  readonly emotion_labels: readonly string[];
  readonly guide_messages: readonly string[];
}

// -----------------------------------------------------------------------------
// year_key format
// -----------------------------------------------------------------------------

/**
 * year_key format: `"YYYY_anniversary"` — computed from
 * `profiles.activation_started_at` (fallback `created_at`).
 *
 * Example: `"2027_anniversary"`. Anchored to activation anniversary, NOT
 * Gregorian calendar year (REQUIREMENTS decision #4).
 */
export const YEAR_KEY_PATTERN = /^[0-9]{4}_anniversary$/;

// -----------------------------------------------------------------------------
// Runtime guard
// -----------------------------------------------------------------------------

/**
 * Narrow runtime type guard for payloads read back from the RPC. Cheap shape
 * check — rules out obviously-wrong responses in dev without pulling zod
 * (NFR-08). Plan 11.03 `aggregate.ts` calls this before passing the payload
 * to the page / share-card components.
 */
export function isYIRPublicStats(x: unknown): x is YIRPublicStats {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.reflections_count === "number" &&
    (typeof r.awareness_avg === "number" || r.awareness_avg === null) &&
    Array.isArray(r.milestones_reached) &&
    typeof r.cycle_count === "number" &&
    (r.earliest_reflection_at === null ||
      typeof r.earliest_reflection_at === "string") &&
    (r.latest_reflection_at === null ||
      typeof r.latest_reflection_at === "string") &&
    Array.isArray(r.awareness_trajectory)
  );
}
