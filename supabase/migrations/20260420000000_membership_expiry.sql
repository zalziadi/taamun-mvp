-- v1.4 Phase 1: membership expiry column on profiles
-- Used by invite reward (+30 days) and subscription-length accounting.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.expires_at IS
  'Paid membership expiry. NULL = no active paid membership. Extended by invite rewards and subscription renewals.';

CREATE INDEX IF NOT EXISTS profiles_expires_at_idx
  ON public.profiles (expires_at)
  WHERE expires_at IS NOT NULL;
