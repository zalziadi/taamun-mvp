-- Invite system: each user has a unique invite code.
-- When an invitee subscribes, both sides get +1 month credit.

-- Invite codes (one per user, permanent)
CREATE TABLE IF NOT EXISTS public.invite_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uses INT NOT NULL DEFAULT 0
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Owner can read their code
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invite_codes' AND policyname = 'invite_codes_owner_read'
  ) THEN
    CREATE POLICY invite_codes_owner_read ON public.invite_codes
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Anyone (even unauthenticated) can read a code by value (for /invite/[code] landing page)
-- This is safe because codes are random and only reveal user_id + uses count
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invite_codes' AND policyname = 'invite_codes_public_read'
  ) THEN
    CREATE POLICY invite_codes_public_read ON public.invite_codes
      FOR SELECT TO anon
      USING (TRUE);
  END IF;
END $$;

-- Redemptions: log who used which code
CREATE TABLE IF NOT EXISTS public.invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL REFERENCES public.invite_codes(code) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rewarded BOOLEAN NOT NULL DEFAULT FALSE,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (invitee_user_id)  -- each invitee can only be credited once
);

ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Both inviter and invitee can see redemptions involving them
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invite_redemptions' AND policyname = 'invite_redemptions_involved'
  ) THEN
    CREATE POLICY invite_redemptions_involved ON public.invite_redemptions
      FOR SELECT TO authenticated
      USING (auth.uid() = inviter_user_id OR auth.uid() = invitee_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS invite_redemptions_inviter_idx
  ON public.invite_redemptions (inviter_user_id);

-- Helper: increment uses counter atomically
CREATE OR REPLACE FUNCTION public.increment_invite_uses(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.invite_codes SET uses = uses + 1 WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
