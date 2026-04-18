-- Extend guide_memory with theme tracking and refresh metadata
-- Builds on existing guide_memory table (already has soul_summary column)

ALTER TABLE public.guide_memory
  ADD COLUMN IF NOT EXISTS themes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.guide_memory
  ADD COLUMN IF NOT EXISTS soul_summary_updated_at TIMESTAMPTZ;

ALTER TABLE public.guide_memory
  ADD COLUMN IF NOT EXISTS soul_summary_token_count INT NOT NULL DEFAULT 0;

-- Index for finding users due for a refresh (not updated in last 7 days)
CREATE INDEX IF NOT EXISTS guide_memory_summary_refresh_idx
  ON public.guide_memory (soul_summary_updated_at NULLS FIRST);
