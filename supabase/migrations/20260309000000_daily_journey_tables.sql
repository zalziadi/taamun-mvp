-- =========================================
-- Daily Journey UX Tables
-- Created: 2026-03-09
-- =========================================

-- reflections: one row per user per day (Step 5 auto-save)
CREATE TABLE IF NOT EXISTS public.reflections (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day          INT         NOT NULL CHECK (day >= 1 AND day <= 28),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, day)
);

ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reflections_owner" ON public.reflections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- awareness_logs: daily presence check (Step 6)
-- level: 'present' | 'tried' | 'distracted'
CREATE TABLE IF NOT EXISTS public.awareness_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day        INT         NOT NULL CHECK (day >= 1 AND day <= 28),
  level      TEXT        NOT NULL CHECK (level IN ('present', 'tried', 'distracted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, day)
);

ALTER TABLE public.awareness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "awareness_logs_owner" ON public.awareness_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
