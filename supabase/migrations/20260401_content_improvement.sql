-- Content self-improvement v0.1: add district, awareness state, custom question, companion verse
ALTER TABLE pattern_insights
  ADD COLUMN IF NOT EXISTS district INT CHECK (district BETWEEN 1 AND 9),
  ADD COLUMN IF NOT EXISTS awareness_state TEXT CHECK (awareness_state IN ('shadow', 'gift', 'potential')),
  ADD COLUMN IF NOT EXISTS custom_question TEXT,
  ADD COLUMN IF NOT EXISTS companion_verse TEXT,
  ADD COLUMN IF NOT EXISTS companion_verse_ref TEXT;
