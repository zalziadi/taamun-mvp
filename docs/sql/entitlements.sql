-- Entitlements: per-user subscription status
CREATE TABLE IF NOT EXISTS entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'ramadan_28',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON entitlements (user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_status ON entitlements (status);

-- Activation codes for Ramadan 28-day entitlement
CREATE TABLE IF NOT EXISTS activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'ramadan_28',
  max_uses int NOT NULL DEFAULT 1,
  used_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes (code);

-- If table already exists with uses_count: ALTER TABLE activation_codes RENAME COLUMN uses_count TO used_count;
-- Then: ALTER TABLE activation_codes ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
--       ALTER TABLE activation_codes ADD COLUMN IF NOT EXISTS expires_at timestamptz;
