-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Add cycle support to progress table
-- Date: 2026-04-18
-- Purpose: Enable multi-cycle journey tracking (Cycle 1, 2, 3...)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- The Taamun program has 3 cycles of 28 days each:
--   Cycle 1: الظل والهدية (Shadow & Gift)
--   Cycle 2: النفس والعلاقات (Self & Relationships)
--   Cycle 3: السور الكاملة (Full Surahs)
--
-- After cycle 3, users loop back to cycle 1 with archived history preserved.
--
-- This migration adds:
--   1. progress.current_cycle — which cycle the user is currently on (default 1)
--   2. progress.completed_cycles — array of cycles the user has fully completed
--
-- Run this in Supabase SQL Editor on production.

-- ── 1. Add current_cycle column (default 1, not null) ──
ALTER TABLE public.progress
  ADD COLUMN IF NOT EXISTS current_cycle INT NOT NULL DEFAULT 1;

-- ── 2. Add completed_cycles array ──
ALTER TABLE public.progress
  ADD COLUMN IF NOT EXISTS completed_cycles INT[] NOT NULL DEFAULT ARRAY[]::INT[];

-- ── 3. Add check constraint (cycle >= 1) ──
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'progress_current_cycle_positive'
  ) THEN
    ALTER TABLE public.progress
      ADD CONSTRAINT progress_current_cycle_positive CHECK (current_cycle >= 1);
  END IF;
END $$;

-- ── 4. Index for cycle queries (e.g., analytics) ──
CREATE INDEX IF NOT EXISTS progress_current_cycle_idx
  ON public.progress (current_cycle);

-- ── 5. Backfill: users who completed 28 days but never "started a new cycle"
-- remain on cycle 1 with 28 completed days. No data change needed.

-- ── Verification ──
-- After running, check:
--   SELECT user_id, current_day, current_cycle, completed_cycles
--   FROM progress LIMIT 5;
