-- Guide sessions: persistent conversation storage
CREATE TABLE IF NOT EXISTS public.guide_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_guide_sessions_user ON public.guide_sessions(user_id, updated_at DESC);

ALTER TABLE public.guide_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own guide sessions"
  ON public.guide_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Guide memory: cumulative soul summary per user
CREATE TABLE IF NOT EXISTS public.guide_memory (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  soul_summary TEXT NOT NULL DEFAULT '',
  themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own guide memory"
  ON public.guide_memory
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role writes guide_memory (generated server-side)
CREATE POLICY "Service role manages guide memory"
  ON public.guide_memory
  FOR ALL
  USING (true)
  WITH CHECK (true);
