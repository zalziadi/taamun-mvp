-- v1.4 Phase 2: In-app threads — lightweight discussions attached to a day or verse.

CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Anchor: either day (1-28+) or verse_ref (e.g., "البقرة: 255")
  anchor_type TEXT NOT NULL CHECK (anchor_type IN ('day', 'verse')),
  anchor_value TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 10 AND 1500),
  -- Identity: pseudonym or real display name
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 40),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'removed')),
  reply_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.thread_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 40),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_replies ENABLE ROW LEVEL SECURITY;

-- Public read for published threads; owner can CRUD their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'threads' AND policyname = 'threads_read_published') THEN
    CREATE POLICY threads_read_published ON public.threads
      FOR SELECT TO anon, authenticated USING (status = 'published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'threads' AND policyname = 'threads_owner_write') THEN
    CREATE POLICY threads_owner_write ON public.threads
      FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'thread_replies' AND policyname = 'replies_read_published') THEN
    CREATE POLICY replies_read_published ON public.thread_replies
      FOR SELECT TO anon, authenticated USING (status = 'published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'thread_replies' AND policyname = 'replies_owner_write') THEN
    CREATE POLICY replies_owner_write ON public.thread_replies
      FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS threads_anchor_idx
  ON public.threads (anchor_type, anchor_value, created_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS threads_user_idx ON public.threads (user_id);
CREATE INDEX IF NOT EXISTS replies_thread_idx
  ON public.thread_replies (thread_id, created_at ASC)
  WHERE status = 'published';

-- Trigger: increment reply_count on insert
CREATE OR REPLACE FUNCTION public.increment_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.threads
  SET reply_count = reply_count + 1, updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'threads_reply_count_trg') THEN
    CREATE TRIGGER threads_reply_count_trg
      AFTER INSERT ON public.thread_replies
      FOR EACH ROW EXECUTE FUNCTION public.increment_thread_reply_count();
  END IF;
END $$;
