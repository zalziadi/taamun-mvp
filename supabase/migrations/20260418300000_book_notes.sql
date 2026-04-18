-- Book notes and quoted highlights (per-user, private)
-- Unified table: type='bookmark' for simple refs, type='quote' for snippets, type='note' for reflections

CREATE TABLE IF NOT EXISTS public.book_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bookmark', 'quote', 'note')),
  chapter TEXT NOT NULL,
  -- For quotes: the quoted text. For notes: the user's reflection. For bookmarks: optional.
  content TEXT NOT NULL,
  -- Optional page reference (e.g., "42" or "ص. ٤٢")
  page_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.book_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'book_notes' AND policyname = 'book_notes_owner'
  ) THEN
    CREATE POLICY book_notes_owner ON public.book_notes
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS book_notes_user_idx ON public.book_notes (user_id);
CREATE INDEX IF NOT EXISTS book_notes_user_chapter_idx ON public.book_notes (user_id, chapter);
CREATE INDEX IF NOT EXISTS book_notes_user_type_idx ON public.book_notes (user_id, type);

-- Auto-update updated_at on modification
CREATE OR REPLACE FUNCTION public.set_book_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'book_notes_updated_at_trg'
  ) THEN
    CREATE TRIGGER book_notes_updated_at_trg
      BEFORE UPDATE ON public.book_notes
      FOR EACH ROW
      EXECUTE FUNCTION public.set_book_notes_updated_at();
  END IF;
END $$;
