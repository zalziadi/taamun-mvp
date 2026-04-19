-- v1.4 Phase 3: Creator Mode (VIP) — users publish their own 7- or 14-day mini-journeys.

CREATE TABLE IF NOT EXISTS public.creator_journeys (
  slug TEXT PRIMARY KEY,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 20 AND 500),
  duration_days INT NOT NULL CHECK (duration_days IN (7, 14)),
  creator_display_name TEXT NOT NULL CHECK (char_length(creator_display_name) BETWEEN 2 AND 60),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'flagged', 'removed')),
  subscriber_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_journey_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_slug TEXT NOT NULL REFERENCES public.creator_journeys(slug) ON DELETE CASCADE,
  day_number INT NOT NULL CHECK (day_number >= 1 AND day_number <= 14),
  verse_text TEXT NOT NULL,
  verse_ref TEXT NOT NULL,
  reflection_prompt TEXT NOT NULL CHECK (char_length(reflection_prompt) BETWEEN 10 AND 500),
  exercise TEXT CHECK (exercise IS NULL OR char_length(exercise) BETWEEN 10 AND 500),
  UNIQUE (journey_slug, day_number)
);

-- Each user's progress through a creator journey
CREATE TABLE IF NOT EXISTS public.creator_journey_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_slug TEXT NOT NULL REFERENCES public.creator_journeys(slug) ON DELETE CASCADE,
  current_day INT NOT NULL DEFAULT 1,
  completed_days INT[] NOT NULL DEFAULT ARRAY[]::INT[],
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, journey_slug)
);

ALTER TABLE public.creator_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_journey_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_journey_subscriptions ENABLE ROW LEVEL SECURITY;

-- Journeys: public can read published; creator has full access to own drafts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_journeys' AND policyname = 'journeys_read_published') THEN
    CREATE POLICY journeys_read_published ON public.creator_journeys
      FOR SELECT TO anon, authenticated USING (status = 'published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_journeys' AND policyname = 'journeys_creator_all') THEN
    CREATE POLICY journeys_creator_all ON public.creator_journeys
      FOR ALL TO authenticated
      USING (auth.uid() = creator_user_id) WITH CHECK (auth.uid() = creator_user_id);
  END IF;
END $$;

-- Days: public can read days of published journeys; creator can CRUD own days
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_journey_days' AND policyname = 'days_read_published') THEN
    CREATE POLICY days_read_published ON public.creator_journey_days
      FOR SELECT TO anon, authenticated
      USING (EXISTS (
        SELECT 1 FROM public.creator_journeys j
        WHERE j.slug = creator_journey_days.journey_slug
          AND (j.status = 'published' OR j.creator_user_id = auth.uid())
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_journey_days' AND policyname = 'days_creator_write') THEN
    CREATE POLICY days_creator_write ON public.creator_journey_days
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.creator_journeys j
        WHERE j.slug = creator_journey_days.journey_slug AND j.creator_user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_journey_days' AND policyname = 'days_creator_modify') THEN
    CREATE POLICY days_creator_modify ON public.creator_journey_days
      FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.creator_journeys j
        WHERE j.slug = creator_journey_days.journey_slug AND j.creator_user_id = auth.uid()
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_journey_days' AND policyname = 'days_creator_delete') THEN
    CREATE POLICY days_creator_delete ON public.creator_journey_days
      FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.creator_journeys j
        WHERE j.slug = creator_journey_days.journey_slug AND j.creator_user_id = auth.uid()
      ));
  END IF;
END $$;

-- Subscriptions: user owns their progress
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_journey_subscriptions' AND policyname = 'cjs_owner') THEN
    CREATE POLICY cjs_owner ON public.creator_journey_subscriptions
      FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS journeys_published_idx
  ON public.creator_journeys (status, created_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS journey_days_slug_idx
  ON public.creator_journey_days (journey_slug, day_number);

CREATE INDEX IF NOT EXISTS cjs_user_idx
  ON public.creator_journey_subscriptions (user_id, last_active_at DESC);

-- Trigger: increment subscriber_count on insert
CREATE OR REPLACE FUNCTION public.increment_journey_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.creator_journeys
  SET subscriber_count = subscriber_count + 1, updated_at = now()
  WHERE slug = NEW.journey_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'journeys_subscriber_count_trg') THEN
    CREATE TRIGGER journeys_subscriber_count_trg
      AFTER INSERT ON public.creator_journey_subscriptions
      FOR EACH ROW EXECUTE FUNCTION public.increment_journey_subscriber_count();
  END IF;
END $$;
