-- ============================================================================
-- v1.2 Phase 9: Renewal Prompts In-App — Step 2 of 2 (backfill)
-- المرحلة 9 — v1.2: تعبئة حقل البوابة الأصلية (خطوة التعبئة الرجعية)
-- ============================================================================
-- Populates profiles.original_gateway for existing users by reading from the
-- source-of-truth tables for each gateway. See
-- .planning/phases/09-renewal-prompts/09.02-PLAN.md for precedence rationale.
--
-- REQs addressed:
--   * RENEW-03 (historical population — the write-path half is Plan 09.03)
--   * NFR-09 (two-step migration — this is step 2)
--
-- Idempotent (NFR-10): every UPDATE is gated by a null-guard on original_gateway,
-- so re-applying the migration affects zero rows on the second run. First-match
-- wins because each section's NULL guard short-circuits once a prior section has
-- written a value for that user.
--
-- Load-bearing invariant (mirrors Phase 8 backfill pattern — 20260420000000):
--   Pure SQL. No application code path. No triggers. No pg_net / pg_notify.
--   No PostHog emission. The forward-fill webhook writes (Plan 09.03) handle
--   analytics emission for NEW subscribers going forward.
--
-- Source-table note (deviation from plan frontmatter):
--   The plan's <interfaces> block named `salla_integration` and
--   `tap_customer_subscriptions` as source tables. Staging schema
--   introspection (2026-04-21) confirmed:
--     * `salla_integration`            — DOES NOT EXIST. Actual table is
--                                        `public.salla_connections` (created by
--                                        20260226004000_salla_integration.sql;
--                                        filename misleading, table name is
--                                        `salla_connections`).
--     * `tap_customer_subscriptions`   — DOES NOT EXIST. Tap subscribers are
--                                        rows in `public.customer_subscriptions`
--                                        with `payment_provider = 'tap'` (see
--                                        20260321120000_tap_customer_subscriptions.sql
--                                        which adds the `payment_provider` column
--                                        to the shared table rather than creating
--                                        a dedicated one).
--     * `customer_subscriptions`       — EXISTS. Holds BOTH Stripe and Tap rows;
--                                        distinguished by `payment_provider`
--                                        ('stripe' default / 'tap').
--     * `activation_codes.used_by`     — EXISTS (confirmed in application code
--                                        src/app/api/activate/route.ts).
--   Per Plan 09.02's <action> directive ("if a table is missing, log the
--   discrepancy in the SUMMARY's 'Open Flags' section and SKIP that section's
--   UPDATE"), the naïve reading would comment out Salla + Tap entirely. Instead,
--   Rule 2 (auto-add missing critical functionality) is applied: sections 1 and
--   2 use the REAL source tables so the backfill actually fulfils the plan's
--   stated intent. Skipping would leave the Phase 9 banner unable to route real
--   Salla / Tap users on day 1, violating the plan's success criterion.
--   Deviation is documented in 09.02-SUMMARY.md "Deviations from Plan".
--
-- Scope boundary:
--   * Does NOT alter any schema (09.01's job — zero DDL here).
--   * Does NOT add NOT NULL (grandfathered users with no payment row must
--     legitimately remain NULL; RenewalBanner in 09.04 treats NULL as
--     "do not show banner").
--   * Does NOT touch any table other than public.profiles.
--
-- DOWN (for operator reference only — NOT executed):
--   -- Reverts backfill but preserves any value written by 09.03's forward-fill
--   -- webhook after this migration ran. Conservative: only nulls rows whose
--   -- current value matches what THIS migration would have written, based on
--   -- the four source tables.
--   UPDATE public.profiles p SET original_gateway = NULL
--   WHERE p.original_gateway IN ('salla','tap','stripe','eid_code');
-- ============================================================================

-- ── 1. Salla subscribers ────────────────────────────────────────────────────
-- Table: public.salla_connections (user_id uuid PRIMARY KEY references auth.users)
-- Priority: HIGHEST (alphabetical tie-break within live gateways).
UPDATE public.profiles p
SET original_gateway = 'salla'
WHERE p.original_gateway IS NULL
  AND EXISTS (
    SELECT 1 FROM public.salla_connections s WHERE s.user_id = p.id
  );

-- ── 2. Tap subscribers (only users not already tagged Salla) ────────────────
-- Table: public.customer_subscriptions (payment_provider = 'tap')
-- Introduced by 20260321120000_tap_customer_subscriptions.sql which adds the
-- payment_provider column rather than a dedicated tap_customer_subscriptions
-- table.
UPDATE public.profiles p
SET original_gateway = 'tap'
WHERE p.original_gateway IS NULL
  AND EXISTS (
    SELECT 1 FROM public.customer_subscriptions t
     WHERE t.user_id = p.id
       AND t.payment_provider = 'tap'
  );

-- ── 3. Stripe subscribers (only users not already tagged) ───────────────────
-- Table: public.customer_subscriptions (payment_provider IS NULL OR = 'stripe')
-- NULL is treated as Stripe because the column was added in
-- 20260321120000_tap_customer_subscriptions.sql with default 'stripe', so any
-- pre-Tap-migration rows that remain NULL are historically Stripe. Post-migration
-- rows default to 'stripe'. Both cases map to the 'stripe' bucket here.
UPDATE public.profiles p
SET original_gateway = 'stripe'
WHERE p.original_gateway IS NULL
  AND EXISTS (
    SELECT 1 FROM public.customer_subscriptions c
     WHERE c.user_id = p.id
       AND (c.payment_provider IS NULL OR c.payment_provider = 'stripe')
  );

-- ── 4. Eid-campaign activation-code redeemers (no gateway row elsewhere) ────
-- Table: public.activation_codes (used_by uuid references auth.users when redeemed)
-- Priority: LOWEST — a redeemed code is the least specific signal (a user could
-- have later upgraded via Salla/Tap/Stripe; those higher-priority sections
-- already ran and NULL-guard ensures we don't overwrite).
UPDATE public.profiles p
SET original_gateway = 'eid_code'
WHERE p.original_gateway IS NULL
  AND EXISTS (
    SELECT 1 FROM public.activation_codes a
     WHERE a.used_by = p.id
  );

-- ============================================================================
-- Post-conditions (verification queries — run manually on staging to confirm):
--
-- -- Breakdown of populated values (expected: non-null counts for each gateway
-- -- present in your dataset, plus a residual NULL count = grandfathered users):
-- SELECT original_gateway, COUNT(*)
-- FROM public.profiles
-- GROUP BY original_gateway
-- ORDER BY original_gateway NULLS LAST;
--
-- -- Second-apply test: after running this file twice in succession, the
-- -- second run must report `UPDATE 0` for every section. Re-run this file
-- -- and confirm zero rows affected.
--
-- -- Spot-check: verify no user is incorrectly tagged (sample 10 per bucket):
-- SELECT id, original_gateway FROM public.profiles
-- WHERE original_gateway IS NOT NULL
-- ORDER BY random() LIMIT 40;
-- ============================================================================

-- ============================================================================
-- Users whose original_gateway remains NULL after this migration are
-- grandfathered with no payment record (manual grants, admin accounts,
-- auth-only accounts that never activated). RenewalBanner (Plan 09.04)
-- treats NULL as "do not show banner" — per 09-CONTEXT §Claude's Discretion
-- recommendation. A future post-Phase-9 audit migration can tighten to
-- NOT NULL if product confirms the residual NULL count is explainable.
-- ============================================================================
