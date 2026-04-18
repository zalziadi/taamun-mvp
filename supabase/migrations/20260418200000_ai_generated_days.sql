-- Cache for AI-generated cycle content (shared pool across all users)
-- When a user reaches cycle 4+, content is generated once and cached here.

CREATE TABLE IF NOT EXISTS public.ai_generated_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle INT NOT NULL CHECK (cycle >= 4),
  day INT NOT NULL CHECK (day >= 1 AND day <= 28),
  -- Content fields matching DayContent interface
  title TEXT NOT NULL,
  chapter TEXT NOT NULL,
  verse TEXT NOT NULL,
  verse_ref TEXT NOT NULL,
  silence_prompt TEXT NOT NULL DEFAULT '',
  question TEXT NOT NULL,
  exercise TEXT NOT NULL DEFAULT '',
  hidden_layer TEXT NOT NULL DEFAULT '',
  book_quote TEXT NOT NULL DEFAULT '',
  book_chapter TEXT NOT NULL,
  -- Metadata
  model_used TEXT,
  theme_name TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generation_cost_cents INT DEFAULT 0,
  UNIQUE (cycle, day)
);

-- Public read (content is shared); only admin/service can write
ALTER TABLE public.ai_generated_days ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_generated_days' AND policyname = 'ai_days_read_all'
  ) THEN
    CREATE POLICY ai_days_read_all ON public.ai_generated_days
      FOR SELECT TO authenticated USING (TRUE);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ai_days_cycle_day_idx ON public.ai_generated_days (cycle, day);
