-- =========================================
-- Reflection Deepening + RAG + Analytics
-- Created: 2026-03-10
-- =========================================

-- 1) Extend reflections with richer context
ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS surah TEXT,
  ADD COLUMN IF NOT EXISTS ayah INT,
  ADD COLUMN IF NOT EXISTS emotion TEXT,
  ADD COLUMN IF NOT EXISTS awareness_state TEXT;

ALTER TABLE public.reflections
  DROP CONSTRAINT IF EXISTS reflections_ayah_check,
  DROP CONSTRAINT IF EXISTS reflections_awareness_state_check;

ALTER TABLE public.reflections
  ADD CONSTRAINT reflections_ayah_check
    CHECK (ayah IS NULL OR ayah > 0),
  ADD CONSTRAINT reflections_awareness_state_check
    CHECK (
      awareness_state IS NULL
      OR awareness_state IN ('shadow', 'gift', 'best_possibility')
    );

CREATE INDEX IF NOT EXISTS reflections_user_day_idx
  ON public.reflections (user_id, day DESC);

-- 2) pgvector for RAG chunks
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.book_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  token_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, chunk_index)
);

ALTER TABLE public.book_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "book_chunks_authenticated_read" ON public.book_chunks;
CREATE POLICY "book_chunks_authenticated_read" ON public.book_chunks
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "book_chunks_service_write" ON public.book_chunks;
CREATE POLICY "book_chunks_service_write" ON public.book_chunks
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Similarity search function for RAG
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
LANGUAGE SQL
STABLE
AS $$
  SELECT
    bc.id,
    bc.source,
    bc.chunk_index,
    bc.content,
    1 - (bc.embedding <=> query_embedding) AS similarity
  FROM public.book_chunks bc
  ORDER BY bc.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;
