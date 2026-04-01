-- Najm Al-Janoub bridge tables (in Taamun Supabase, prefix: najm_)

-- Nightly aggregated reports
CREATE TABLE IF NOT EXISTS najm_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hijri_date TEXT NOT NULL,
  cycle_day INT NOT NULL,
  total_users INT NOT NULL DEFAULT 0,
  active_users INT NOT NULL DEFAULT 0,
  district_distribution JSONB DEFAULT '{}',
  state_distribution JSONB DEFAULT '{}',
  avg_depth_score INT DEFAULT 0,
  shifts_count INT DEFAULT 0,
  ai_summary TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_day)
);

-- Improvement tasks for CJ execution
CREATE TABLE IF NOT EXISTS najm_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('improvement', 'observation', 'alert')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'running', 'completed', 'rejected')) DEFAULT 'pending',
  district INT CHECK (district BETWEEN 1 AND 9),
  source TEXT NOT NULL DEFAULT 'analyzer',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for dashboard queries
CREATE INDEX idx_najm_tasks_status ON najm_tasks(status);
CREATE INDEX idx_najm_reports_cycle ON najm_reports(cycle_day);
