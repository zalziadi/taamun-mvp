-- If gen_random_uuid() is missing: CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS admin_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  plan_key text NOT NULL,
  max_uses int NOT NULL DEFAULT 1,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_activations_created_at ON admin_activations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activations_identifier ON admin_activations (identifier);
CREATE INDEX IF NOT EXISTS idx_admin_activations_plan_key ON admin_activations (plan_key);
