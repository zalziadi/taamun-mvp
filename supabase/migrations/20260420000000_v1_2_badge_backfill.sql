-- ============================================================================
-- Phase 8 — v1.2 Retention Loop: Retroactive badge backfill
-- المرحلة 8 — v1.2 حلقة البقاء: تعبئة الشارات الرجعية
-- ============================================================================
-- REQs addressed:
--   * BADGE-07 — existing users are backfilled with historical milestone
--     badges on deploy. Every backfilled row has `notified = true` so no
--     notification/animation/toast fires on first /progress visit post-deploy.
--
-- NFRs upheld:
--   * NFR-08: Pure SQL. No runtime dependencies.
--   * NFR-09: Additive-only. No destructive DDL. No ALTER TABLE. Re-running
--     this migration is a no-op (ON CONFLICT DO NOTHING on every INSERT).
--   * NFR-10: Idempotent — safe to re-apply on any environment.
--
-- Load-bearing invariant (PITFALL #4 — retroactive badge event-spam on deploy):
--   This migration MUST NOT invoke any application code path. No triggers
--   that call pg_net / HTTP endpoints. No NOTIFY channels consumed by a
--   PostHog forwarder. No webhook. The only side effect is INSERT INTO
--   public.badges with notified=true. PostHog events fire from the Phase 7
--   `unlockBadge` helper's `emitEvent` call — a raw SQL INSERT bypasses the
--   helper entirely, which is exactly what BADGE-07 demands.
--
-- Cycle attribution:
--   Reflections do NOT have a cycle_number column (schema predates v1.2
--   cycles — see supabase/migrations/20260309000000_daily_journey_tables.sql,
--   reflections table is keyed UNIQUE(user_id, day) only). Historical
--   milestone reflections are therefore attributed to cycle 1 — the cycle
--   they were written in. Archived cycles (progress.completed_cycles INT[],
--   added by 20260418000000_add_cycles_support.sql) each produce a
--   cycle_complete badge + a full milestone sweep keyed on the cycle_number
--   in the array.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Milestone badges (day_1, day_3, day_7, day_14, day_21) for cycle 1
-- ----------------------------------------------------------------------------
-- For every (user_id, day) tuple in reflections where day ∈ {1,3,7,14,21},
-- insert a badge row with unlocked_at = MIN(created_at) for that tuple.
-- Cycle is always 1 (historical reflections lived under cycle 1 only).
-- notified=true so future unlockBadge() calls on (user,code,1) are no-ops
-- (the helper's ignoreDuplicates + length-gt-zero gate blocks emitEvent).
-- ON CONFLICT DO NOTHING — safe to re-run.
-- ----------------------------------------------------------------------------

INSERT INTO public.badges (user_id, badge_code, cycle_number, unlocked_at, notified)
SELECT
  r.user_id,
  'day_' || r.day::text AS badge_code,
  1 AS cycle_number,
  MIN(r.created_at) AS unlocked_at,
  true AS notified
FROM public.reflections r
WHERE r.day IN (1, 3, 7, 14, 21)
GROUP BY r.user_id, r.day
ON CONFLICT (user_id, badge_code, cycle_number) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Day-28 milestone badges — cycle 1 only, from reflections
-- ----------------------------------------------------------------------------
-- Phase 7's day_28 unlock fires on cycle TRANSITION (start-cycle route).
-- A user who wrote a day-28 reflection but never tapped "واصل الرحلة" has
-- NO day_28 badge. Backfill it here with reflections.created_at timestamp.
-- ON CONFLICT protects Phase 7's rows (transitions that already awarded it).
-- ----------------------------------------------------------------------------

INSERT INTO public.badges (user_id, badge_code, cycle_number, unlocked_at, notified)
SELECT
  r.user_id,
  'day_28' AS badge_code,
  1 AS cycle_number,
  MIN(r.created_at) AS unlocked_at,
  true AS notified
FROM public.reflections r
WHERE r.day = 28
GROUP BY r.user_id
ON CONFLICT (user_id, badge_code, cycle_number) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. cycle_complete badges for every archived cycle in progress.completed_cycles
-- ----------------------------------------------------------------------------
-- For every user with a non-empty completed_cycles array, insert one
-- cycle_complete row per archived cycle_number. unlocked_at uses
-- progress.updated_at (best-available timestamp — completed_cycles does
-- not carry per-cycle archive times). Falls back to now() if updated_at
-- is somehow null (defensive; column is NOT NULL per schema).
-- ----------------------------------------------------------------------------

INSERT INTO public.badges (user_id, badge_code, cycle_number, unlocked_at, notified)
SELECT
  p.user_id,
  'cycle_complete' AS badge_code,
  c.cycle_n AS cycle_number,
  COALESCE(p.updated_at, now()) AS unlocked_at,
  true AS notified
FROM public.progress p,
     LATERAL unnest(COALESCE(p.completed_cycles, ARRAY[]::int[])) AS c(cycle_n)
WHERE c.cycle_n BETWEEN 1 AND 99
ON CONFLICT (user_id, badge_code, cycle_number) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Day-28 milestone badges for ARCHIVED cycles (cycle_number > 1)
-- ----------------------------------------------------------------------------
-- If a user finished cycle 1 (completed_cycles contains 1), Phase 7 may
-- have awarded day_28 for cycle 1 on the start-cycle transition. But
-- historical cycle-2 completions predating Phase 7 deploy would have no
-- day_28 row. Backfill defensively — ON CONFLICT protects Phase 7's rows.
-- ----------------------------------------------------------------------------

INSERT INTO public.badges (user_id, badge_code, cycle_number, unlocked_at, notified)
SELECT
  p.user_id,
  'day_28' AS badge_code,
  c.cycle_n AS cycle_number,
  COALESCE(p.updated_at, now()) AS unlocked_at,
  true AS notified
FROM public.progress p,
     LATERAL unnest(COALESCE(p.completed_cycles, ARRAY[]::int[])) AS c(cycle_n)
WHERE c.cycle_n BETWEEN 1 AND 99
ON CONFLICT (user_id, badge_code, cycle_number) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Milestone badges (day_1..day_21) for ARCHIVED cycles (cycle_number > 1)
-- ----------------------------------------------------------------------------
-- Mirror of section 1 for users who have multi-cycle progress. Since
-- reflections table is keyed on (user_id, day) without cycle, we assume
-- each archived cycle had a full milestone sweep (the user DID reach day 28
-- to archive the cycle — archival is gated on completed_days.includes(28)
-- in the start-cycle route). Creates one row per
-- (user, milestone ∈ {1,3,7,14,21}, archived_cycle_number).
-- unlocked_at uses progress.updated_at as the closest-available timestamp.
-- ----------------------------------------------------------------------------

INSERT INTO public.badges (user_id, badge_code, cycle_number, unlocked_at, notified)
SELECT
  p.user_id,
  'day_' || m.day_n::text AS badge_code,
  c.cycle_n AS cycle_number,
  COALESCE(p.updated_at, now()) AS unlocked_at,
  true AS notified
FROM public.progress p,
     LATERAL unnest(COALESCE(p.completed_cycles, ARRAY[]::int[])) AS c(cycle_n),
     LATERAL unnest(ARRAY[1, 3, 7, 14, 21]) AS m(day_n)
WHERE c.cycle_n BETWEEN 1 AND 99
ON CONFLICT (user_id, badge_code, cycle_number) DO NOTHING;

-- ============================================================================
-- Post-conditions (verification queries — run manually to confirm):
--
-- -- Count backfilled rows by (badge_code, cycle_number):
-- SELECT badge_code, cycle_number, COUNT(*)
-- FROM public.badges
-- WHERE notified = true
-- GROUP BY badge_code, cycle_number
-- ORDER BY cycle_number, badge_code;
--
-- -- Spot-check day-9 customer scenario — user with day_number up to 9
-- -- should now have day_1, day_3, day_7 badges in cycle 1:
-- SELECT u.id, b.badge_code, b.unlocked_at, b.notified
-- FROM auth.users u
-- JOIN public.badges b ON b.user_id = u.id
-- WHERE b.cycle_number = 1
-- ORDER BY u.id, b.badge_code;
--
-- -- Verify zero rows with notified=false (all backfilled rows must be silent):
-- SELECT COUNT(*) FROM public.badges WHERE notified = false;
-- ============================================================================

-- ============================================================================
-- DOWN (manual rollback — Supabase migrations are UP-only; copy-paste to revert):
--   -- Removes backfilled milestone + cycle_complete rows. Phase 7 rows
--   -- (which also have notified=true) would also be matched — if you need
--   -- to distinguish, filter by unlocked_at matching reflections.created_at
--   -- (backfill sections 1-2) vs progress.updated_at (backfill sections 3-5).
--   DELETE FROM public.badges WHERE notified = true AND badge_code IN
--     ('day_1','day_3','day_7','day_14','day_21','day_28','cycle_complete');
-- ============================================================================
