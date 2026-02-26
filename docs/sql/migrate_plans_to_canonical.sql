-- Migration: Unify legacy plan names to canonical (ramadan_28, plan_280_monthly, plan_820_full, trial_24h)
-- Run only if you have existing rows with base, plan820, etc. The API normalizes at runtime; this cleans persisted data for consistency.

-- activation_codes (optional: API normalizes on activation; this is for display/consistency)
UPDATE activation_codes SET plan = 'plan_280_monthly' WHERE plan IN ('base', 'plan_280', 'plan280', '280', '220');
UPDATE activation_codes SET plan = 'plan_820_full' WHERE plan IN ('plan820', 'plan_820', '820');
UPDATE activation_codes SET plan = 'trial_24h' WHERE plan IN ('trial');
UPDATE activation_codes SET plan = 'ramadan_28' WHERE plan IN ('ramadan28', '80');

-- entitlements (recommended: /api/entitlement reads this; canonical names ensure consistency)
UPDATE entitlements SET plan = 'plan_280_monthly' WHERE plan IN ('base', 'plan_280', 'plan280', '280', '220');
UPDATE entitlements SET plan = 'plan_820_full' WHERE plan IN ('plan820', 'plan_820', '820');
UPDATE entitlements SET plan = 'trial_24h' WHERE plan IN ('trial');
UPDATE entitlements SET plan = 'ramadan_28' WHERE plan IN ('ramadan28', '80');
