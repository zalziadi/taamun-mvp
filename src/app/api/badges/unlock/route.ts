/**
 * src/app/api/badges/unlock/route.ts
 *
 * POST endpoint that records a Phase-7-scoped badge for the authenticated
 * user idempotently and emits the `badge_unlock` TypedEvent exactly once
 * (RETURN-07).
 *
 * Delegates the core logic to `unlockBadge()` in `src/lib/badges/unlock.ts`
 * so that the cycle-transition path (start-cycle/route.ts, Plan 07.02/04)
 * and this client-facing route use a single source of truth for the
 * idempotent-insert-plus-event invariant.
 *
 * Phase 7 scope guard: `badge_code` MUST equal `"day_28"`. Phase 8 will
 * widen the whitelist to include day_1 / day_3 / day_7 / day_14 / day_21
 * and cycle_complete — at that point this file gains the other codes in
 * the `PHASE_7_ALLOWED_BADGE_CODES` set.
 *
 * Schema contract: Plan 07.01 (public.badges + UNIQUE user_id,badge_code,cycle_number).
 * Event contract: Plan 06.01 (TypedEvent badge_unlock variant).
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unlockBadge, type Phase7BadgeCode } from "@/lib/badges/unlock";

const PHASE_7_ALLOWED_BADGE_CODES = new Set<Phase7BadgeCode>(["day_28"]);

export async function POST(req: Request) {
  // 1. Auth — same pattern as start-cycle/route.ts
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate body
  const body = (await req.json().catch(() => ({}))) as {
    badge_code?: string;
    cycle_number?: number;
    day_number?: number;
  };

  const badge_code = body.badge_code;
  const cycle_number = body.cycle_number;
  const day_number = body.day_number;

  if (
    !badge_code ||
    typeof cycle_number !== "number" ||
    typeof day_number !== "number"
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!PHASE_7_ALLOWED_BADGE_CODES.has(badge_code as Phase7BadgeCode)) {
    return NextResponse.json(
      {
        error: "badge_code_not_in_phase_7_scope",
        allowed: Array.from(PHASE_7_ALLOWED_BADGE_CODES),
      },
      { status: 400 },
    );
  }

  // 3. Delegate to helper — single source of truth for idempotency + event
  const result = await unlockBadge(
    auth.user.id,
    badge_code as Phase7BadgeCode,
    cycle_number,
    day_number,
  );

  if (result.reason === "db_error") {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    unlocked: result.unlocked,
    reason: result.unlocked ? undefined : "already_unlocked",
  });
}
