/**
 * src/lib/badges/unlock.ts
 *
 * Single source of truth for milestone-badge idempotent unlock.
 *
 * Phase 8 widened the BadgeCode union from Phase 7's "day_28"-only scope to
 * the full 7-code set. Day 1/3/7/14/21 unlocks are triggered from
 * `/api/reflections` POST (fire-and-forget, Plan 08.02). Cycle-complete unlock
 * is triggered from `/api/program/start-cycle` alongside day_28 (Plan 08.03).
 * Idempotency is data-driven on onConflict="user_id,badge_code,cycle_number"
 * — unchanged from Phase 7.
 *
 * Called from the following sites with identical semantics:
 *   1. POST /api/badges/unlock (Plan 07.04 Task 2) — client-initiated route.
 *   2. POST /api/program/start-cycle (Plan 07.04 Task 3, Plan 08.03) —
 *      server-side invocation inside the cycle-transition success path so the
 *      day_28 + cycle_complete badges are awarded atomically (from the user's
 *      perspective) as part of the cycle transition — no separate achievement
 *      modal, no client action.
 *   3. POST /api/reflections (Plan 08.02) — fire-and-forget server-side call
 *      after a reflection upsert succeeds on a milestone day (1/3/7/14/21).
 *
 * Requirements delivered:
 *   - RETURN-05: silent reveal — this helper never surfaces UI, only persists
 *     the row + emits the analytics event.
 *   - RETURN-07: exactly-once `badge_unlock` event — the analytics emission
 *     fires ONLY when a row was actually inserted. Duplicate attempts (same
 *     user, same badge_code, same cycle_number) insert zero rows and emit
 *     zero additional events. The UNIQUE (user_id, badge_code, cycle_number)
 *     constraint on `public.badges` (Plan 07.01) is the load-bearing guard.
 *
 * Error posture (load-bearing for start-cycle caller):
 *   - This helper must NEVER throw in a way that fails the cycle transition.
 *   - DB errors are logged via console.warn and swallowed. The badge row may
 *     be recovered on a future call because of the UNIQUE constraint's
 *     idempotency guarantee.
 *   - `emitEvent` is already fire-and-forget (never throws); we still wrap
 *     it in try/catch as belt-and-braces.
 *
 * Schema contract (Plan 07.01):
 *   public.badges (
 *     id uuid PK,
 *     user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *     badge_code text NOT NULL,
 *     cycle_number int NOT NULL CHECK (1..99),
 *     unlocked_at timestamptz NOT NULL DEFAULT now(),
 *     notified boolean NOT NULL DEFAULT false,
 *     UNIQUE (user_id, badge_code, cycle_number)
 *   )
 *
 * Analytics contract (Plan 06.01):
 *   TypedEvent { name: "badge_unlock", properties: { badge_code, day_number, cycle_number } }
 */

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { emitEvent } from "@/lib/analytics/server";
import type { TypedEvent } from "@/lib/analytics/events";

/**
 * Phase 8 widened union. Data-driven idempotency on (user_id, badge_code,
 * cycle_number) means the helper body needed no behavioral change — only the
 * signature type widens.
 */
export type BadgeCode =
  | "day_1"
  | "day_3"
  | "day_7"
  | "day_14"
  | "day_21"
  | "day_28"
  | "cycle_complete";

/** @deprecated Phase 7 alias kept for one commit. Prefer `BadgeCode`. */
export type Phase7BadgeCode = "day_28";

export interface UnlockResult {
  unlocked: boolean;
  reason?: "already_unlocked" | "db_error";
}

/**
 * Idempotently record a badge for a user + cycle and emit `badge_unlock`
 * exactly once across retries.
 *
 * `notified = true` is written because at every call site in Phase 7 the
 * user is already inside the moment (they just tapped the cycle-transition
 * CTA). Phase 8's retroactive backfill path will use `notified = false`
 * instead, per PITFALLS.md #4.
 */
export async function unlockBadge(
  userId: string,
  badge_code: BadgeCode,
  cycle_number: number,
  day_number: number,
): Promise<UnlockResult> {
  const admin = getSupabaseAdmin();

  // upsert with ignoreDuplicates — the UNIQUE (user_id, badge_code, cycle_number)
  // constraint from Plan 07.01 guarantees idempotency. When a duplicate is
  // encountered, the row is skipped and `.select()` returns an empty array.
  let inserted = false;
  try {
    const { data, error } = await admin
      .from("badges")
      .upsert(
        {
          user_id: userId,
          badge_code,
          cycle_number,
          unlocked_at: new Date().toISOString(),
          notified: true,
        },
        {
          onConflict: "user_id,badge_code,cycle_number",
          ignoreDuplicates: true,
        },
      )
      .select();

    if (error) {
      console.warn("[badges/unlock] db_error:", error.message);
      return { unlocked: false, reason: "db_error" };
    }

    inserted = Array.isArray(data) && data.length > 0;
  } catch (err) {
    console.warn("[badges/unlock] unexpected:", (err as Error).message);
    return { unlocked: false, reason: "db_error" };
  }

  if (!inserted) {
    return { unlocked: false, reason: "already_unlocked" };
  }

  // Fire-and-forget — only when a row was actually inserted. This is the
  // RETURN-07 "exactly once" invariant.
  try {
    const event: TypedEvent = {
      name: "badge_unlock",
      properties: { badge_code, day_number, cycle_number },
    };
    await emitEvent(event, userId);
  } catch (err) {
    // emitEvent is documented as never-throwing, but belt-and-braces:
    console.warn("[badges/unlock] emit failed:", (err as Error).message);
  }

  return { unlocked: true };
}
