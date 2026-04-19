-- ============================================================================
-- Phase 10 — v1.2 Retention Loop: Referrals table (FRIEND-XXXX invites)
-- المرحلة 10 — v1.2 حلقة البقاء: جدول الإحالات (أكواد FRIEND-XXXX)
-- ============================================================================
-- REQs addressed:
--   * REFER-02 — NEW `public.referrals` table (distinct from `activation_codes`
--     — separates billing concerns from reward concerns per research §R1).
--   * REFER-07 — DB-level self-referral refusal via CHECK constraint
--     (defense-in-depth; app layer in /api/referral/create + /api/activate
--     also enforces, but the DB is the ultimate backstop).
--   * REFER-12 — RLS posture: row-owner SELECT only. All writes flow through
--     service-role (getSupabaseAdmin()), mirroring the badges/activation_codes
--     pattern established in Phase 7.
--
-- NFRs upheld:
--   * NFR-09 (two-step migration): Additive ONLY. No drops, no NOT NULL on
--     nullable redemption columns, no seeds.
--   * NFR-08: No runtime dependencies introduced. SQL only.
--   * NFR-10: Idempotent — re-applying this file is a no-op thanks to
--     IF NOT EXISTS guards on every DDL statement + DO-block policy creates.
--
-- Scope boundary:
--   * Does NOT seed any rows.
--   * Does NOT touch `activation_codes` (billing codes stay independent).
--   * Does NOT touch `profiles` (referrer reward extends expires_at at cron
--     time in Plan 10.05 — runtime only, not migration-time).
--   * Does NOT touch `progress` (day-14 gate reads it at cron time, does not
--     modify it).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. referrals table (REFER-02)
-- ----------------------------------------------------------------------------
-- State machine (enforced by status CHECK):
--   pending_invitee   → code generated, no redemption yet (invitee_id NULL)
--   pending_day14     → invitee redeemed; waiting on day-14 retention gate
--   rewarded          → referrer credited (expires_at extended; audit stamp set)
--   refunded          → invitee refunded/cancelled within 14d → reward voided
--   void              → admin/manual void (abuse, fraud, etc.)
--
-- Nullability rationale:
--   * invitee_id NULL until `/api/activate` redeems the FRIEND-* code.
--   * invitee_redeemed_at / referrer_rewarded_at NULL until the real event
--     fires — no DEFAULT now() so audit timestamps reflect truth.
--
-- FK ON DELETE rules:
--   * referrer_id → CASCADE: if the referrer's auth.users row is purged,
--     cascade-delete their referrals (data subject deletion symmetry).
--   * invitee_id → SET NULL: preserve the referrer's audit trail even if
--     the invitee's account is later deleted.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending_invitee'
    CHECK (status IN ('pending_invitee','pending_day14','rewarded','refunded','void')),
  invitee_redeemed_at timestamptz NULL,
  referrer_rewarded_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- REFER-07: DB-level self-referral refusal.
  -- NULL-safe: allows invitee_id NULL (pending_invitee rows) while still
  -- refusing any row where both sides resolve to the same user.
  CONSTRAINT referrals_no_self_referral
    CHECK (invitee_id IS NULL OR referrer_id <> invitee_id),
  -- Prevents the same (referrer, invitee) pair from being recorded twice.
  -- Postgres treats NULLs as distinct in UNIQUE, so a single referrer may
  -- still hold multiple pending_invitee rows (invitee_id NULL) — which is
  -- the intended behavior (code generation before redemption).
  CONSTRAINT referrals_unique_pair UNIQUE (referrer_id, invitee_id)
);

-- ----------------------------------------------------------------------------
-- 2. Indexes
-- ----------------------------------------------------------------------------
-- referrer_id — /account/referral page reads (user sees own invites).
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id
  ON public.referrals (referrer_id);

-- invitee_id — /api/activate FRIEND-* redemption path looks up by invitee.
CREATE INDEX IF NOT EXISTS idx_referrals_invitee_id
  ON public.referrals (invitee_id);

-- Partial index for the Plan 10.05 cron credit job — keeps index tiny by
-- indexing only the hot subset (rows awaiting day-14 gate evaluation).
CREATE INDEX IF NOT EXISTS idx_referrals_status_redeemed
  ON public.referrals (status, invitee_redeemed_at)
  WHERE status = 'pending_day14';

-- ----------------------------------------------------------------------------
-- 3. RLS — SELECT only for row-related users. Writes via service_role.
-- ----------------------------------------------------------------------------
-- REFER-12: authenticated users can SELECT rows where they are either the
-- referrer (to view their own invite list on /account/referral) OR the
-- invitee (so they see the referral row that credited them, per REFER-11
-- transparent status copy). NO INSERT/UPDATE/DELETE policies exist — all
-- writes flow through getSupabaseAdmin() (service role bypasses RLS),
-- mirroring the Phase 7 badges pattern + existing activation_codes pattern.
-- ----------------------------------------------------------------------------

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'referrals' AND policyname = 'users_select_own_referrals_as_referrer'
  ) THEN
    CREATE POLICY "users_select_own_referrals_as_referrer" ON public.referrals
      FOR SELECT TO authenticated
      USING (auth.uid() = referrer_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'referrals' AND policyname = 'users_select_own_referrals_as_invitee'
  ) THEN
    CREATE POLICY "users_select_own_referrals_as_invitee" ON public.referrals
      FOR SELECT TO authenticated
      USING (auth.uid() = invitee_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Documentation
-- ----------------------------------------------------------------------------

COMMENT ON TABLE public.referrals IS
  'v1.2 Phase 10 — Referral Program. FRIEND-XXXX codes + pending_day14 retention gate. Writes via service role only (RLS blocks client writes). See .planning/phases/10-referral-program/10-CONTEXT.md §Storage.';

-- ============================================================================
-- DOWN (manual rollback — Supabase migrations are UP-only; copy-paste to revert)
-- ============================================================================
-- DROP TABLE IF EXISTS public.referrals CASCADE;
-- ============================================================================
