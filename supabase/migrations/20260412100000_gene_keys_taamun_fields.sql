-- Add taamun-specific fields to gene keys profile
ALTER TABLE user_gene_keys_profile
  ADD COLUMN IF NOT EXISTS wm TEXT,        -- الوعي المسموم
  ADD COLUMN IF NOT EXISTS wf TEXT,        -- الوعي الفائق
  ADD COLUMN IF NOT EXISTS ws TEXT,        -- الوعي السامي
  ADD COLUMN IF NOT EXISTS ayah TEXT,      -- الآية القرآنية
  ADD COLUMN IF NOT EXISTS ayah_ref TEXT;  -- مرجع الآية
