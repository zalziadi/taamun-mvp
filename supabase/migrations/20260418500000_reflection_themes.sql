-- Reflection theme clusters (per-user, refreshed monthly)

CREATE TABLE IF NOT EXISTS public.reflection_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  reflection_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  reflection_count INT NOT NULL DEFAULT 0,
  sample_texts TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  rank INT NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reflection_themes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reflection_themes' AND policyname = 'reflection_themes_owner'
  ) THEN
    CREATE POLICY reflection_themes_owner ON public.reflection_themes
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS reflection_themes_user_idx
  ON public.reflection_themes (user_id, rank);

CREATE INDEX IF NOT EXISTS reflection_themes_generated_idx
  ON public.reflection_themes (generated_at);
