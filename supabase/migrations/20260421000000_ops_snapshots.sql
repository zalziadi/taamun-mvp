-- v2.2 Phase 1: daily operator snapshot — one row per metric per day.
-- Tiny table: 16 metrics × ~365 rows/year = <6k rows/year even at 10y.

CREATE TABLE IF NOT EXISTS public.ops_snapshots (
  id BIGSERIAL PRIMARY KEY,
  captured_on DATE NOT NULL,
  metric TEXT NOT NULL,
  value BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (captured_on, metric)
);

-- Index optimized for the /admin/ops trend view: "last 30 days of metric X".
CREATE INDEX IF NOT EXISTS ops_snapshots_metric_date_idx
  ON public.ops_snapshots (metric, captured_on DESC);

-- RLS: service role only. No client read/write; /api/ops/* does the gating.
ALTER TABLE public.ops_snapshots ENABLE ROW LEVEL SECURITY;
-- No policies = no access except via service role / server code.
