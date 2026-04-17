-- Add cycle support to progress table
-- Enables multi-cycle journey: Cycle 1 (الظل), Cycle 2 (النفس), Cycle 3 (السور)

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
