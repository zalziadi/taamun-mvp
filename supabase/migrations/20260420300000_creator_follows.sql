-- v1.6 Phase 2: users can follow a creator to get notified on new published journeys.

CREATE TABLE IF NOT EXISTS public.creator_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_user_id, creator_user_id),
  CHECK (follower_user_id <> creator_user_id)
);

ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;

-- The follower owns their row
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'creator_follows' AND policyname = 'cf_follower_owner'
  ) THEN
    CREATE POLICY cf_follower_owner ON public.creator_follows
      FOR ALL TO authenticated
      USING (auth.uid() = follower_user_id)
      WITH CHECK (auth.uid() = follower_user_id);
  END IF;
  -- The creator can SELECT their followers (count + list for dashboard)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'creator_follows' AND policyname = 'cf_creator_read'
  ) THEN
    CREATE POLICY cf_creator_read ON public.creator_follows
      FOR SELECT TO authenticated
      USING (auth.uid() = creator_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS creator_follows_creator_idx
  ON public.creator_follows (creator_user_id);

CREATE INDEX IF NOT EXISTS creator_follows_follower_idx
  ON public.creator_follows (follower_user_id, created_at DESC);
