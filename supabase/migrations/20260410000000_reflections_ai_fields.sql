-- Phase 4 · Task 2 — AI Reflection Engine: schema extension
--
-- Adds four AI analysis columns to the reflections table. Idempotent:
-- safe to run on any environment, whether or not previous attempts
-- partially succeeded. Uses IF NOT EXISTS so re-running is a no-op.
--
-- What each column holds (populated server-side after a reflection
-- save by /api/reflections POST fire-and-forget):
--
--   ai_sentiment  → one of 'resistant' | 'neutral' | 'open'
--   ai_theme      → 2-3 words naming the inner movement
--   ai_mirror     → one short Arabic sentence reflecting the unspoken
--   ai_suggestion → one short Arabic invitation (not an instruction)
--
-- All four columns are nullable. A reflection may exist without AI
-- fields if the AI call failed, OPENAI_API_KEY was missing, or the
-- row was saved before this migration. The UI handles the null case.
--
-- No backfill. Older reflections stay NULL until the user edits them.

ALTER TABLE reflections
  ADD COLUMN IF NOT EXISTS ai_sentiment  text,
  ADD COLUMN IF NOT EXISTS ai_theme      text,
  ADD COLUMN IF NOT EXISTS ai_mirror     text,
  ADD COLUMN IF NOT EXISTS ai_suggestion text;

-- Optional sanity constraint: sentiment must be one of the three
-- enum values. Added as a CHECK on the column. Idempotent drop/add
-- pattern so re-running doesn't error.
ALTER TABLE reflections
  DROP CONSTRAINT IF EXISTS reflections_ai_sentiment_check;

ALTER TABLE reflections
  ADD CONSTRAINT reflections_ai_sentiment_check
  CHECK (ai_sentiment IS NULL OR ai_sentiment IN ('resistant', 'neutral', 'open'));
