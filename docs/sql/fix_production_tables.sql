-- =============================================
-- FIX PRODUCTION: Consolidated migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Date: 2026-03-24
-- =============================================

-- ── 1. Extensions ──
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 2. profiles (base table) ──
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  full_name TEXT,
  subscription_status TEXT,
  subscription_tier TEXT,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_own') THEN
    CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_own') THEN
    CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Service role can do everything on profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_service_all') THEN
    CREATE POLICY profiles_service_all ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Add missing columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- ── 3. progress ──
CREATE TABLE IF NOT EXISTS public.progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_day INT NOT NULL DEFAULT 1 CHECK (current_day BETWEEN 1 AND 28),
  completed_days INT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'progress' AND policyname = 'progress_owner') THEN
    CREATE POLICY progress_owner ON public.progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 4. user_answers ──
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day INT NOT NULL CHECK (day BETWEEN 1 AND 28),
  observe TEXT NOT NULL DEFAULT '',
  insight TEXT NOT NULL DEFAULT '',
  contemplate TEXT NOT NULL DEFAULT '',
  rebuild TEXT,
  ai_reflection TEXT,
  ai_response JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_user_answers_user_day ON public.user_answers (user_id, day);
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_answers' AND policyname = 'user_answers_owner') THEN
    CREATE POLICY user_answers_owner ON public.user_answers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 5. reflections ──
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day INT NOT NULL CHECK (day >= 1 AND day <= 28),
  note TEXT,
  surah TEXT,
  ayah INT,
  emotion TEXT,
  awareness_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS surah TEXT;
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS ayah INT;
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS emotion TEXT;
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS awareness_state TEXT;

CREATE INDEX IF NOT EXISTS reflections_user_day_idx ON public.reflections (user_id, day DESC);
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reflections' AND policyname = 'reflections_owner') THEN
    CREATE POLICY reflections_owner ON public.reflections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 6. awareness_logs ──
CREATE TABLE IF NOT EXISTS public.awareness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day INT NOT NULL CHECK (day >= 1 AND day <= 28),
  level TEXT NOT NULL CHECK (level IN ('present', 'tried', 'distracted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

ALTER TABLE public.awareness_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'awareness_logs' AND policyname = 'awareness_logs_owner') THEN
    CREATE POLICY awareness_logs_owner ON public.awareness_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 7. ramadan_insights ──
CREATE TABLE IF NOT EXISTS public.ramadan_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shadow TEXT,
  gift TEXT,
  best_potential TEXT,
  clarity_score INT,
  responsibility_score INT,
  trust_score INT,
  surrender_score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.ramadan_insights ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ramadan_insights' AND policyname = 'ramadan_insights_owner') THEN
    CREATE POLICY ramadan_insights_owner ON public.ramadan_insights FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 8. guide_sessions ──
CREATE TABLE IF NOT EXISTS public.guide_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guide_sessions_user ON public.guide_sessions(user_id, updated_at DESC);
ALTER TABLE public.guide_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'guide_sessions' AND policyname = 'guide_sessions_user') THEN
    CREATE POLICY guide_sessions_user ON public.guide_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Service role needs full access for guide_sessions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'guide_sessions' AND policyname = 'guide_sessions_service') THEN
    CREATE POLICY guide_sessions_service ON public.guide_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 9. guide_memory ──
CREATE TABLE IF NOT EXISTS public.guide_memory (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  soul_summary TEXT NOT NULL DEFAULT '',
  themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_memory ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'guide_memory' AND policyname = 'guide_memory_read') THEN
    CREATE POLICY guide_memory_read ON public.guide_memory FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'guide_memory' AND policyname = 'guide_memory_service') THEN
    CREATE POLICY guide_memory_service ON public.guide_memory FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 10. book_chunks (RAG) ──
CREATE TABLE IF NOT EXISTS public.book_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  token_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, chunk_index)
);

ALTER TABLE public.book_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_chunks_authenticated_read" ON public.book_chunks;
CREATE POLICY "book_chunks_authenticated_read" ON public.book_chunks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "book_chunks_service_write" ON public.book_chunks;
CREATE POLICY "book_chunks_service_write" ON public.book_chunks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RAG similarity search function
CREATE OR REPLACE FUNCTION public.match_book_chunks(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source TEXT,
  chunk_index INT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT bc.id, bc.source, bc.chunk_index, bc.content,
    1 - (bc.embedding <=> query_embedding) AS similarity
  FROM public.book_chunks bc
  ORDER BY bc.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;

-- ── 11. Verification query ──
SELECT
  'profiles' AS table_name, COUNT(*) AS row_count FROM public.profiles
UNION ALL SELECT 'progress', COUNT(*) FROM public.progress
UNION ALL SELECT 'user_answers', COUNT(*) FROM public.user_answers
UNION ALL SELECT 'reflections', COUNT(*) FROM public.reflections
UNION ALL SELECT 'awareness_logs', COUNT(*) FROM public.awareness_logs
UNION ALL SELECT 'guide_sessions', COUNT(*) FROM public.guide_sessions
UNION ALL SELECT 'guide_memory', COUNT(*) FROM public.guide_memory
UNION ALL SELECT 'book_chunks', COUNT(*) FROM public.book_chunks
UNION ALL SELECT 'activation_codes', COUNT(*) FROM public.activation_codes;
