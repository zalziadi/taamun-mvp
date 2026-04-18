-- ============================================================================
-- Phase 7 — v1.2 Retention Loop: Badges table + Cycle-pause race guard column
-- المرحلة 7 — v1.2 حلقة البقاء: جدول الشارات + عمود حارس السباق لدورة الحلقة
-- ============================================================================
-- REQs addressed:
--   * RETURN-02 — adds progress.cycle_paused_at for optimistic-concurrency
--     guard on /api/program/start-cycle (Plan 07.02 consumes it).
--   * RETURN-05 — creates the `badges` table that Plan 07.04 writes to
--     idempotently on Day-28 silent unlock. The UNIQUE(user_id, badge_code,
--     cycle_number) constraint is load-bearing: it is the ON CONFLICT target.
--
-- NFRs upheld:
--   * NFR-09 (two-step migration): Additive ONLY. No NOT NULL on the new
--     column, no defaults that rewrite history, no destructive drops.
--     The enforcement step (tightening constraints, backfills) lands in a
--     later phase if needed.
--   * NFR-08: No runtime dependencies introduced. SQL only.
--   * NFR-10: Idempotent — re-applying this file is a no-op thanks to the
--     IF NOT EXISTS guards on every DDL statement.
--
-- Scope boundary:
--   * Phase 7 only needs the `day_28` badge_code at runtime. Phase 8 will
--     backfill/emit day_1, day_3, day_7, day_14, day_21, cycle_complete.
--     This migration intentionally does NOT seed any badge rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. progress.cycle_paused_at — race-guard column (RETURN-02)
-- ----------------------------------------------------------------------------
-- Nullable timestamptz. No default. No NOT NULL. The concurrency guard in
-- Plan 07.02 sets this at the moment a cycle transition starts and clears
-- it on success; a non-null value newer than N seconds means another device
-- is mid-transition and the current request should 409 back.
-- ----------------------------------------------------------------------------

ALTER TABLE public.progress
  ADD COLUMN IF NOT EXISTS cycle_paused_at timestamptz;

-- ----------------------------------------------------------------------------
-- 2. badges table (RETURN-05)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_code text NOT NULL,
  cycle_number int NOT NULL CHECK (cycle_number >= 1 AND cycle_number <= 99),
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  -- `notified` — Phase 8 uses this for retroactive-backfill silence so old
  -- milestones do not emit push/email when a user who already passed Day 14
  -- gets a backfilled day_14 badge. See PITFALLS.md #4.
  notified boolean NOT NULL DEFAULT false,
  -- Load-bearing: ON CONFLICT target for idempotent Day-28 insert in Plan 07.04.
  UNIQUE (user_id, badge_code, cycle_number)
);

-- Index for /progress page reads (user fetches their own badge list).
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON public.badges (user_id);

-- ----------------------------------------------------------------------------
-- 3. RLS — SELECT only for the owner. Writes go through service_role.
-- ----------------------------------------------------------------------------
-- Per ARCHITECTURE.md §"RLS posture for new tables": badges writes are
-- business-logic-gated (Day-28 completion check) and must NEVER be client-
-- authorable. The server uses getSupabaseAdmin() (service role, bypasses
-- RLS) to INSERT. No FOR INSERT / FOR UPDATE / FOR DELETE policies exist.
-- ----------------------------------------------------------------------------

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'badges' AND policyname = 'users_select_own_badges'
  ) THEN
    CREATE POLICY "users_select_own_badges" ON public.badges
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- DOWN (manual rollback — Supabase migrations are UP-only; copy-paste to revert)
-- ============================================================================
-- DROP TABLE IF EXISTS public.badges;
-- ALTER TABLE public.progress DROP COLUMN IF EXISTS cycle_paused_at;
-- ============================================================================
