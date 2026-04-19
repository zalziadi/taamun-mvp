-- ============================================================================
-- v1.2 Phase 9: Renewal Prompts In-App — Step 1 of 2 (additive)
-- المرحلة 9 — v1.2: حقل البوابة الأصلية في جدول profiles (خطوة إضافة فقط)
-- ============================================================================
-- Adds profiles.original_gateway column so Plans 09.02 (backfill) and 09.03
-- (forward-fill from webhooks) can populate it, and Plan 09.04 (RenewalBanner)
-- can read it to pick the correct gateway CTA.
--
-- Values (enforced by CHECK): 'salla' | 'tap' | 'stripe' | 'eid_code'
-- NULL is permitted — existing rows remain NULL until Plan 09.02 backfills them.
--
-- NFR-09 compliance: additive-only. No DEFAULT (keeps rewrite instant on PG 14+).
-- Column is nullable. Backfill is a separate migration (09.02). Nullability
-- tightening is deferred to post-backfill verification — see Plan 09.02
-- success criteria.
--
-- Idempotency (NFR-10): ADD COLUMN IF NOT EXISTS + DO block for constraint so
-- re-apply is a no-op on staging and prod.
--
-- REQs addressed:
--   * RENEW-03 (partial — schema only; backfill + write paths in 09.02/03)
--   * NFR-09 (two-step migration — this is step 1)
--
-- Scope boundary:
--   * Does NOT backfill existing rows (Plan 09.02).
--   * Does NOT wire webhook writes (Plan 09.03).
--   * Does NOT touch any other tables or other profiles columns.
--
-- DOWN (for reference only — NOT executed; rollback is a manual operator task):
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_original_gateway_check;
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS original_gateway;
-- ============================================================================

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS original_gateway text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_original_gateway_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_original_gateway_check
      CHECK (original_gateway IS NULL OR original_gateway IN ('salla', 'tap', 'stripe', 'eid_code'));
  END IF;
END
$$;

COMMENT ON COLUMN public.profiles.original_gateway IS
  'v1.2 Phase 9: gateway user originally paid through. Populated by webhooks (Plan 09.03) + one-time backfill (Plan 09.02). Read by RenewalBanner (Plan 09.04) to route CTA.';
