-- Cognitive Journey System — extends existing schema
-- Run: supabase db push

-- 1. Extend user_memory with identity + cognitive tracking
ALTER TABLE user_memory
ADD COLUMN IF NOT EXISTS identity JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS themes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS drift_history INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_cognitive_update TIMESTAMPTZ;

-- 2. Cognitive actions — suggested actions from the system
CREATE TABLE IF NOT EXISTS cognitive_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 28),
  type TEXT NOT NULL CHECK (type IN ('reflection', 'review', 'decision', 'practice')),
  label TEXT NOT NULL,
  description TEXT,
  suggested_next_step TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'expired')),
  feedback_impact TEXT CHECK (feedback_impact IN ('low', 'medium', 'high')),
  feedback_note TEXT,
  effectiveness_score INTEGER CHECK (effectiveness_score BETWEEN 0 AND 10),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cognitive_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own cognitive_actions" ON cognitive_actions
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_actions_user ON cognitive_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_actions_status ON cognitive_actions(user_id, status);

-- 3. Reflection links — connections between reflections across days
CREATE TABLE IF NOT EXISTS reflection_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_day INTEGER NOT NULL CHECK (source_day >= 1 AND source_day <= 28),
  target_day INTEGER NOT NULL CHECK (target_day >= 1 AND target_day <= 28),
  insight TEXT,
  emotional_arc TEXT CHECK (emotional_arc IN ('deepening', 'shifting', 'repeating', 'emerging')),
  patterns TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reflection_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own reflection_links" ON reflection_links
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_reflection_links_user ON reflection_links(user_id);
