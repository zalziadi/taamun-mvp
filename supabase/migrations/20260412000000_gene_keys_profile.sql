-- Gene Keys Hologenetic Profile
-- Stores the 11 spheres calculated from birth data

CREATE TABLE user_gene_keys_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sphere TEXT NOT NULL,
  gene_key INTEGER NOT NULL CHECK (gene_key BETWEEN 1 AND 64),
  line INTEGER NOT NULL CHECK (line BETWEEN 1 AND 6),
  shadow TEXT,
  gift TEXT,
  siddhi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sphere)
);

-- Store birth data for recalculation
CREATE TABLE user_birth_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  birth_place TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_gene_keys_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_birth_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own gene keys"
ON user_gene_keys_profile FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "service inserts gene keys"
ON user_gene_keys_profile FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user reads own birth data"
ON user_birth_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "user inserts own birth data"
ON user_birth_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_gene_keys_user ON user_gene_keys_profile(user_id);
CREATE INDEX idx_birth_data_user ON user_birth_data(user_id);
