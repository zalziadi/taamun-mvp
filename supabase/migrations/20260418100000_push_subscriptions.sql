-- Push notification subscriptions for web push API

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  -- Preferences
  morning_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  morning_hour INT NOT NULL DEFAULT 6 CHECK (morning_hour >= 0 AND morning_hour < 24),
  streak_at_risk_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sent_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INT NOT NULL DEFAULT 0,
  -- Ensure one endpoint per user (avoid duplicates if re-subscribed)
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_subscriptions' AND policyname = 'push_subs_owner'
  ) THEN
    CREATE POLICY push_subs_owner ON public.push_subscriptions
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS push_subs_user_idx ON public.push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS push_subs_morning_idx
  ON public.push_subscriptions (morning_enabled, morning_hour)
  WHERE morning_enabled = TRUE;
