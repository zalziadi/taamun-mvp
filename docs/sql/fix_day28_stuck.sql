-- ═══════════════════════════════════════════════════════════════════════════
-- Taamun — Day 28 Stuck Diagnostic + Repair
-- Run sections in order. Each block tells you whether to proceed.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── SECTION 1: DIAGNOSTIC (read-only — safe to run anytime) ──

-- 1a. Do the cycle columns exist in production?
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'progress'
  AND column_name IN ('current_day', 'current_cycle', 'completed_cycles', 'completed_days');

-- 1b. What CHECK constraints are active on progress?
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.progress'::regclass
ORDER BY conname;

-- 1c. User distribution by day + cycle
SELECT
  COALESCE(current_cycle, 1) AS cycle,
  current_day,
  COUNT(*) AS users
FROM public.progress
GROUP BY cycle, current_day
ORDER BY cycle DESC, current_day DESC
LIMIT 30;

-- 1d. How many users are stuck on day 28, cycle 1, for > 3 days?
SELECT COUNT(*) AS stuck_users
FROM public.progress
WHERE current_day = 28
  AND COALESCE(current_cycle, 1) = 1
  AND updated_at < now() - interval '3 days';

-- 1e. List the stuck users (for follow-up communication)
SELECT
  p.user_id,
  p.current_day,
  COALESCE(p.current_cycle, 1) AS cycle,
  array_length(p.completed_days, 1) AS days_completed,
  p.updated_at,
  pr.email
FROM public.progress p
LEFT JOIN public.profiles pr ON pr.id = p.user_id
WHERE p.current_day = 28
  AND COALESCE(p.current_cycle, 1) = 1
  AND p.updated_at < now() - interval '3 days'
ORDER BY p.updated_at ASC
LIMIT 50;

-- ═══════════════════════════════════════════════════════════════════════════
-- ── SECTION 2: APPLY CYCLE MIGRATION (only if 1a shows missing columns) ──
-- ═══════════════════════════════════════════════════════════════════════════

-- Run ONLY if section 1a did not return current_cycle and completed_cycles.
-- This is idempotent (IF NOT EXISTS), safe to run twice.

ALTER TABLE public.progress
  ADD COLUMN IF NOT EXISTS current_cycle INT NOT NULL DEFAULT 1;

ALTER TABLE public.progress
  ADD COLUMN IF NOT EXISTS completed_cycles INT[] NOT NULL DEFAULT ARRAY[]::INT[];

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'progress_current_cycle_positive'
  ) THEN
    ALTER TABLE public.progress
      ADD CONSTRAINT progress_current_cycle_positive CHECK (current_cycle >= 1);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS progress_current_cycle_idx
  ON public.progress (current_cycle);

-- Verify
SELECT user_id, current_day, current_cycle, completed_cycles, updated_at
FROM public.progress
LIMIT 5;

-- ═══════════════════════════════════════════════════════════════════════════
-- ── SECTION 3: RESCUE STUCK USERS (only after section 2 + after deploy) ──
-- ═══════════════════════════════════════════════════════════════════════════

-- ⚠️  Do NOT run this until:
--   (a) Section 2 migration is applied
--   (b) The DayPageClient fix is deployed to production
--   (c) You have decided which users get auto-advanced vs notified manually
--
-- This advances users who finished cycle 1 (day 28) into cycle 2.
-- Archive their day-28 completion, reset current_day to 1, set cycle to 2.

-- DRY RUN — preview what will change (run this first!)
SELECT
  p.user_id,
  pr.email,
  p.current_day,
  COALESCE(p.current_cycle, 1) AS old_cycle,
  2 AS new_cycle,
  p.updated_at AS last_active
FROM public.progress p
LEFT JOIN public.profiles pr ON pr.id = p.user_id
WHERE p.current_day = 28
  AND COALESCE(p.current_cycle, 1) = 1
  AND array_length(p.completed_days, 1) >= 28
  AND p.updated_at < now() - interval '3 days'
ORDER BY p.updated_at ASC;

-- ACTUAL UPDATE — uncomment only after reviewing DRY RUN above
-- BEGIN;
-- UPDATE public.progress
-- SET
--   current_day = 1,
--   current_cycle = 2,
--   completed_cycles = ARRAY[1]::INT[],
--   completed_days = ARRAY[]::INT[],
--   updated_at = now()
-- WHERE current_day = 28
--   AND COALESCE(current_cycle, 1) = 1
--   AND array_length(completed_days, 1) >= 28
--   AND updated_at < now() - interval '3 days';
-- -- inspect the count returned, then either COMMIT or ROLLBACK
-- -- COMMIT;
-- -- ROLLBACK;

-- ═══════════════════════════════════════════════════════════════════════════
-- END
-- ═══════════════════════════════════════════════════════════════════════════
