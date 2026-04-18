-- Shared insights: opt-in, anonymous by default, publicly readable by slug

CREATE TABLE IF NOT EXISTS public.shared_insights (
  slug TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Content: small snippet (max 200 chars enforced by CHECK + app layer)
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 200),
  -- Optional attribution: null = anonymous
  attribution TEXT CHECK (attribution IS NULL OR char_length(attribution) BETWEEN 1 AND 60),
  -- Moderation: auto-approved if content clean; flagged for manual review if contains links etc.
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'removed')),
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_insights ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD their own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shared_insights' AND policyname = 'shared_insights_owner'
  ) THEN
    CREATE POLICY shared_insights_owner ON public.shared_insights
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Anyone (incl. anon) can read published insights
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shared_insights' AND policyname = 'shared_insights_public_published'
  ) THEN
    CREATE POLICY shared_insights_public_published ON public.shared_insights
      FOR SELECT TO anon, authenticated
      USING (status = 'published');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS shared_insights_user_idx
  ON public.shared_insights (user_id);

CREATE INDEX IF NOT EXISTS shared_insights_status_idx
  ON public.shared_insights (status, created_at DESC)
  WHERE status = 'published';
