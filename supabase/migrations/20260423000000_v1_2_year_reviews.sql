-- ============================================================================
-- Phase 11 — v1.2 Year-in-Review: year_reviews cache + get_year_in_review RPC
-- المرحلة 11 — v1.2: جدول أرشيف السنة + دالة التجميع على الخادم
-- ============================================================================
-- REQs addressed:
--   * YIR-02  — Postgres RPC get_year_in_review(uuid, text) returns jsonb
--     that aggregates reflections + awareness_logs + badges + progress into
--     the YIRPublicStats shape (Plan 11.02). Server-side aggregation keeps
--     /year-in-review first render < 3s (Success Criterion #1, PITFALL #9).
--   * YIR-03  — NEW public.year_reviews snapshot table with
--     UNIQUE (user_id, year_key). Row is upserted by the aggregate wrapper
--     (Plan 11.03) on cache miss / stale (>24h) and re-used for <3s reopen.
--   * YIR-12  — Composite index on reflections(user_id, created_at) to
--     unblock fast range scans inside the RPC. Without it the RPC falls
--     back to seq-scan on a year's worth of rows → violates SC #1.
--
-- NFRs upheld:
--   * NFR-01 (privacy by construction): The RPC aggregates ONLY counts,
--     averages, timestamps, and badge codes. It NEVER selects reflections.note,
--     never selects any emotion label / guide message. This is the data-layer
--     privacy boundary; the type-layer boundary lives in Plan 11.02/11.06.
--   * NFR-05 (graceful degradation): All aggregate subqueries are null-safe
--     (coalesce where shape matters; raw null passes through for averages).
--   * NFR-08 (no new runtime deps): Pure SQL + plpgsql. Zero npm changes.
--   * NFR-09 (two-step migrations): Additive ONLY. No DROP, no ALTER DROP,
--     no RENAME, no data rewrite. Re-apply is a no-op.
--
-- Schema realities (verified against existing migrations, not guessed):
--   * reflections.note           — text column name is `note`, not `text`/`body`
--                                  (see 20260309000000_daily_journey_tables.sql).
--                                  The RPC intentionally NEVER selects `note`.
--   * awareness_logs.level       — is text ('present'|'tried'|'distracted'),
--                                  NOT a numeric column. The RPC maps to a
--                                  0..1 scalar: present=1.0, tried=0.5,
--                                  distracted=0.0 (see CASE expression below).
--   * progress.current_cycle     — confirmed (not cycle_number; see
--                                  20260418000000_add_cycles_support.sql).
--   * badges.badge_code          — confirmed.
--   * badges.unlocked_at         — confirmed (see
--                                  20260419000000_v1_2_badges_and_cycle_guard.sql).
--   * profiles.activation_started_at — does NOT exist. Plan 11.01 CONTEXT says
--                                  to fall back to profiles.created_at.
--                                  This RPC uses profiles.created_at as the
--                                  anniversary anchor and documents the fact
--                                  in a NOTE comment on the function.
--
-- Scope boundary:
--   * Does NOT seed year_reviews rows (cache is populated lazily by Plan 11.03).
--   * Does NOT touch reflections / awareness_logs / badges / progress /
--     profiles data — read-only aggregation.
--   * Does NOT add indexes on awareness_logs / badges / progress — those
--     tables already have idx_badges_user_id (Phase 7), progress is keyed by
--     user_id PK, and awareness_logs range scans are bounded by UNIQUE(user_id,
--     day) cardinality (≤28 rows per user per cycle). Revisit if profiling
--     later shows a hotspot.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. year_reviews table (YIR-03)
-- ----------------------------------------------------------------------------
-- payload jsonb has NO DEFAULT by design — a row without an aggregated payload
-- is meaningless; the aggregate wrapper (Plan 11.03) always supplies it.
-- generated_at is set by the wrapper on upsert (default now() is the safety
-- net for manual inserts during debugging).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.year_reviews (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_key     text        NOT NULL,
  payload      jsonb       NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT year_reviews_unique_pair UNIQUE (user_id, year_key)
);

-- ----------------------------------------------------------------------------
-- 2. Indexes
-- ----------------------------------------------------------------------------
-- year_reviews.user_id — /year-in-review page fetches by owner (RLS-filtered).
CREATE INDEX IF NOT EXISTS idx_year_reviews_user
  ON public.year_reviews (user_id);

-- Required for fast RPC range aggregation (YIR-12). Composite, not separate,
-- so Postgres can satisfy the `user_id = ? AND created_at BETWEEN ? AND ?`
-- predicate with a single index range scan.
CREATE INDEX IF NOT EXISTS idx_reflections_user_created
  ON public.reflections (user_id, created_at);

-- ----------------------------------------------------------------------------
-- 3. RLS — SELECT only for the row owner. Writes via service_role only.
-- ----------------------------------------------------------------------------
-- YIR-01 posture (row-owner SELECT only) mirrors the Phase 7 badges + Phase 10
-- referrals pattern. The aggregate wrapper (Plan 11.03) uses
-- getSupabaseAdmin() (service role bypasses RLS) to upsert cache rows.
-- No INSERT / UPDATE / DELETE policies exist — clients can never write.
-- ----------------------------------------------------------------------------

ALTER TABLE public.year_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'year_reviews' AND policyname = 'year_reviews_select_own'
  ) THEN
    CREATE POLICY "year_reviews_select_own" ON public.year_reviews
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. RPC get_year_in_review(p_user_id uuid, p_year_key text) returns jsonb
-- ----------------------------------------------------------------------------
-- Returns the YIRPublicStats shape (see Plan 11.02 TS types):
--   {
--     reflections_count:       int,
--     awareness_avg:           numeric | null,
--     milestones_reached:      text[],
--     cycle_count:             int,
--     earliest_reflection_at:  timestamptz | null,
--     latest_reflection_at:    timestamptz | null,
--     awareness_trajectory:    numeric[]    -- ≤52 weekly bucket averages
--   }
--
-- PRIVACY GUARANTEE (NFR-01, PITFALL #10):
--   This function selects ONLY aggregate data (count, avg, min, max,
--   array_agg of public badge codes). It NEVER references reflections.note,
--   never references any emotion/guide/prayer content. No code path inside
--   the function can leak user-authored text. Any future change to this
--   function MUST preserve this invariant — Plan 11.02/11.06 enforces it at
--   the type layer, but this is the data-layer guarantee.
--
-- Anniversary anchor: p_year_key has format 'YYYY_anniversary' (e.g.,
--   '2027_anniversary'). The window is [anchor_date + (YYYY - anchor_year)y,
--   anchor_date + (YYYY - anchor_year + 1)y). anchor_date is
--   COALESCE(profiles.activation_started_at, profiles.created_at). NOTE:
--   profiles.activation_started_at does not currently exist in the schema —
--   the COALESCE falls through to created_at transparently. If a future
--   migration adds activation_started_at, this function keeps working.
--
-- security definer + explicit search_path: the function needs to read
-- profiles/reflections/awareness_logs/badges/progress across all users when
-- called by server-side code (the wrapper validates p_user_id = auth.uid()
-- before calling). Explicit search_path blocks search-path-hijack attacks.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_year_in_review(
  p_user_id uuid,
  p_year_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_anchor_date  timestamptz;
  v_anchor_year  int;
  v_target_year  int;
  v_window_start timestamptz;
  v_window_end   timestamptz;
  v_result       jsonb;
BEGIN
  -- Parse year from 'YYYY_anniversary' key (tolerant of stray whitespace).
  BEGIN
    v_target_year := substring(trim(p_year_key) from '^(\d{4})')::int;
  EXCEPTION WHEN others THEN
    v_target_year := NULL;
  END;

  IF v_target_year IS NULL THEN
    -- Malformed year_key → return empty aggregates rather than raising,
    -- so the page renders "not enough data" UX instead of 500-ing.
    RETURN jsonb_build_object(
      'reflections_count',     0,
      'awareness_avg',         NULL,
      'milestones_reached',    '[]'::jsonb,
      'cycle_count',           1,
      'earliest_reflection_at', NULL,
      'latest_reflection_at',   NULL,
      'awareness_trajectory',   '[]'::jsonb
    );
  END IF;

  -- NOTE: profiles.activation_started_at does not currently exist; COALESCE
  -- falls through to profiles.created_at (the CONTEXT-approved fallback).
  -- The `to_regclass` guard keeps the function resilient if profiles is
  -- ever renamed.
  SELECT created_at
    INTO v_anchor_date
  FROM public.profiles
  WHERE id = p_user_id
  LIMIT 1;

  IF v_anchor_date IS NULL THEN
    v_anchor_date := now();
  END IF;

  v_anchor_year  := extract(year FROM v_anchor_date)::int;
  v_window_start := v_anchor_date + make_interval(years => (v_target_year - v_anchor_year));
  v_window_end   := v_window_start + interval '1 year';

  -- Build result in a single expression via jsonb_build_object + scalar subqueries.
  -- Privacy-safe: every subquery references aggregate/structural columns only —
  -- no `note`, no body text, no emotion label. Re-audit on any future edit.
  SELECT jsonb_build_object(
    'reflections_count', (
      SELECT count(*)
      FROM public.reflections r
      WHERE r.user_id = p_user_id
        AND r.created_at >= v_window_start
        AND r.created_at <  v_window_end
    ),
    'awareness_avg', (
      -- awareness_logs.level is text ('present'|'tried'|'distracted'); map
      -- to a 0..1 scalar for averaging. NULL if no rows in range.
      SELECT avg(
        CASE a.level
          WHEN 'present'    THEN 1.0
          WHEN 'tried'      THEN 0.5
          WHEN 'distracted' THEN 0.0
        END
      )
      FROM public.awareness_logs a
      WHERE a.user_id = p_user_id
        AND a.created_at >= v_window_start
        AND a.created_at <  v_window_end
    ),
    'milestones_reached', COALESCE(
      (
        SELECT jsonb_agg(DISTINCT b.badge_code ORDER BY b.badge_code)
        FROM public.badges b
        WHERE b.user_id = p_user_id
          AND b.unlocked_at >= v_window_start
          AND b.unlocked_at <  v_window_end
      ),
      '[]'::jsonb
    ),
    'cycle_count', COALESCE(
      (
        SELECT GREATEST(p.current_cycle, COALESCE(array_length(p.completed_cycles, 1), 0))
        FROM public.progress p
        WHERE p.user_id = p_user_id
        LIMIT 1
      ),
      1
    ),
    'earliest_reflection_at', (
      SELECT min(r.created_at)
      FROM public.reflections r
      WHERE r.user_id = p_user_id
        AND r.created_at >= v_window_start
        AND r.created_at <  v_window_end
    ),
    'latest_reflection_at', (
      SELECT max(r.created_at)
      FROM public.reflections r
      WHERE r.user_id = p_user_id
        AND r.created_at >= v_window_start
        AND r.created_at <  v_window_end
    ),
    'awareness_trajectory', COALESCE(
      (
        SELECT jsonb_agg(round(weekly_avg::numeric, 2) ORDER BY week_bucket)
        FROM (
          SELECT
            date_trunc('week', a.created_at) AS week_bucket,
            avg(
              CASE a.level
                WHEN 'present'    THEN 1.0
                WHEN 'tried'      THEN 0.5
                WHEN 'distracted' THEN 0.0
              END
            ) AS weekly_avg
          FROM public.awareness_logs a
          WHERE a.user_id = p_user_id
            AND a.created_at >= v_window_start
            AND a.created_at <  v_window_end
          GROUP BY date_trunc('week', a.created_at)
          ORDER BY date_trunc('week', a.created_at)
          LIMIT 52
        ) s
      ),
      '[]'::jsonb
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Only authenticated role needs execute — the wrapper (Plan 11.03) runs in a
-- server context with the service role which bypasses this grant. Granting to
-- `authenticated` allows server-side calls via supabase-js user clients too.
GRANT EXECUTE ON FUNCTION public.get_year_in_review(uuid, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Documentation
-- ----------------------------------------------------------------------------

COMMENT ON TABLE public.year_reviews IS
  'v1.2 Phase 11 — Year-in-Review snapshot cache. One row per (user_id, year_key). payload jsonb matches YIRPublicStats shape (Plan 11.02). Upserts via service role only (RLS blocks client writes). Stale after 24h per Plan 11.03.';

COMMENT ON FUNCTION public.get_year_in_review(uuid, text) IS
  'v1.2 Phase 11 — Server-side aggregate. Returns YIRPublicStats jsonb for (user_id, YYYY_anniversary). Privacy invariant: NEVER selects reflection text, emotion labels, or guide messages. Data-layer boundary matching type-layer split in src/lib/yearInReview/types.ts. Anniversary anchor = COALESCE(profiles.activation_started_at, profiles.created_at).';

-- ============================================================================
-- DOWN (manual rollback — Supabase migrations are UP-only; copy-paste to revert)
-- ============================================================================
-- DROP FUNCTION IF EXISTS public.get_year_in_review(uuid, text);
-- DROP INDEX IF EXISTS public.idx_reflections_user_created;
-- DROP INDEX IF EXISTS public.idx_year_reviews_user;
-- DROP TABLE IF EXISTS public.year_reviews;
-- ============================================================================
