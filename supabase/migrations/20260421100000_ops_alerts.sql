-- v2.3 Phase 1: threshold-based alert rules on top of ops_snapshots.

CREATE TABLE IF NOT EXISTS public.ops_alerts (
  id BIGSERIAL PRIMARY KEY,
  metric TEXT NOT NULL,
  comparison TEXT NOT NULL CHECK (comparison IN ('>', '<', '>=', '<=', '==')),
  threshold BIGINT NOT NULL,
  label TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ops_alerts_active_idx
  ON public.ops_alerts (active)
  WHERE active = TRUE;

-- Service-role only; all access flows through admin-gated routes.
ALTER TABLE public.ops_alerts ENABLE ROW LEVEL SECURITY;

-- Seed 3 sensible defaults on first run (idempotent — inserts only if missing).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ops_alerts WHERE metric = 'threads_flagged' AND comparison = '>') THEN
    INSERT INTO public.ops_alerts (metric, comparison, threshold, label)
    VALUES ('threads_flagged', '>', 0, 'خيط معلّم للمراجعة');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.ops_alerts WHERE metric = 'journeys_flagged' AND comparison = '>') THEN
    INSERT INTO public.ops_alerts (metric, comparison, threshold, label)
    VALUES ('journeys_flagged', '>', 0, 'رحلة مبدع معلّمة للمراجعة');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.ops_alerts WHERE metric = 'thread_replies_flagged' AND comparison = '>') THEN
    INSERT INTO public.ops_alerts (metric, comparison, threshold, label)
    VALUES ('thread_replies_flagged', '>', 0, 'ردّ معلّم للمراجعة');
  END IF;
END $$;
