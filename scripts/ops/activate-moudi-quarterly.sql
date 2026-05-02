-- ============================================================
-- Ops: تفعيل اشتراك ربع سنوي يدوي للعميلة موضي محمد البوعينين
-- Project: taamun-launch (zvloizemximhbxcysgwl)
-- التشغيل: Supabase SQL Editor → New query → الصق وشغّل بـ RUN
-- ============================================================
--
-- العميلة:
--   الاسم  : موضي محمد البوعينين
--   الإيميل: moody_831@hotmail.com
--   الجوال : 00966553930885
--   user_id: 7c09a3c8-719d-430e-b43f-a257836acccd
--   الباقة : quarterly (90 يوم)
--
-- المنطق مأخوذ من:
--   src/app/api/activate/route.ts          (تحديث profiles)
--   src/app/api/salla/webhook/route.ts     (upsert customer_subscriptions)
--   src/lib/subscriptionDurations.ts       (TIER_DURATION_DAYS.quarterly = 90)
-- ============================================================

BEGIN;

-- ── 1) فحص schema الجدولين ──
-- (نفّذها أولاً لتأكيد الأعمدة قبل INSERT/UPSERT)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='customer_subscriptions'
-- ORDER BY ordinal_position;
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='creator_journey_subscriptions'
-- ORDER BY ordinal_position;
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='profiles'
-- ORDER BY ordinal_position;

-- ── 2) تأكيد وجود user_id في auth.users ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid
  ) THEN
    RAISE EXCEPTION 'auth.users لا يحتوي على هذا user_id — أوقفت العملية';
  END IF;
END $$;

-- ── 3) Upsert في customer_subscriptions (نفس نمط Salla webhook) ──
-- الباقة الربع سنوية = 90 يوم. Provider='manual' للتفعيل اليدوي.
-- ملاحظة: لو stripe_customer_id NOT NULL في المشروع الإنتاجي،
-- نمرّر placeholder بدل null لتجنّب فشل القيد.
INSERT INTO public.customer_subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  payment_provider,
  tap_charge_id,
  status,
  tier,
  current_period_end,
  created_at,
  updated_at
) VALUES (
  '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid,
  'manual-7c09a3c8-719d-430e-b43f-a257836acccd',  -- placeholder (يُستبدل لاحقاً عند ربط دفع فعلي)
  NULL,
  'manual',
  NULL,
  'active',
  'quarterly',
  (now() + interval '90 days'),
  now(),
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  payment_provider   = EXCLUDED.payment_provider,
  status             = EXCLUDED.status,
  tier               = EXCLUDED.tier,
  current_period_end = EXCLUDED.current_period_end,
  updated_at         = now();

-- ── 4) Upsert في profiles (تتبعها صفحة /account وتطبيق entitlement) ──
INSERT INTO public.profiles (
  id,
  full_name,
  subscription_status,
  subscription_tier,
  tier,
  activated_at,
  expires_at,
  updated_at
) VALUES (
  '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid,
  'موضي محمد البوعينين',
  'active',
  'quarterly',
  'quarterly',
  now(),
  (now() + interval '90 days'),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  full_name           = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  subscription_status = EXCLUDED.subscription_status,
  subscription_tier   = EXCLUDED.subscription_tier,
  tier                = EXCLUDED.tier,
  activated_at        = EXCLUDED.activated_at,
  expires_at          = EXCLUDED.expires_at,
  updated_at          = now();

COMMIT;

-- ── 5) التحقق بعد الإدخال (SELECT) ──
SELECT
  'customer_subscriptions' AS source,
  cs.user_id,
  cs.tier,
  cs.status,
  cs.payment_provider,
  cs.current_period_end,
  cs.updated_at
FROM public.customer_subscriptions cs
WHERE cs.user_id = '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid;

SELECT
  'profiles' AS source,
  p.id,
  p.full_name,
  p.subscription_status,
  p.subscription_tier,
  p.tier,
  p.activated_at,
  p.expires_at
FROM public.profiles p
WHERE p.id = '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid;

SELECT
  'auth.users' AS source,
  u.id,
  u.email,
  u.phone,
  u.created_at
FROM auth.users u
WHERE u.id = '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid;
