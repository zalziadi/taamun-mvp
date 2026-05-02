-- ============================================================
-- Ops: تفعيل اشتراك ربع سنوي يدوي للعميلة موضي محمد البوعينين
-- Project: taamun-launch (zvloizemximhbxcysgwl)
-- Platform: Supabase (Postgres مُدار)
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
-- يعتمد على:
--   supabase/migrations/20260502000000_activate_manual_subscription_rpc.sql
-- (إن لم تكن المهاجرة مطبّقة على المشروع الإنتاجي، شغّلها أولاً.)
-- ============================================================

-- ── 1) سلامة: تأكّد أن user_id موجود في auth.users ──
do $$
begin
  if not exists (
    select 1 from auth.users where id = '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid
  ) then
    raise exception 'auth.users لا يحتوي على user_id موضي — أوقفت العملية';
  end if;
end $$;

-- ── 2) سلامة: تأكّد أن صف profile موجود (تحدّيث UPDATE داخل الدالة لا يُنشئ صفاً) ──
insert into public.profiles (id, full_name, role)
values (
  '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid,
  'موضي محمد البوعينين',
  'user'
)
on conflict (id) do nothing;

-- ── 3) استدعاء الـ RPC ──
select public.activate_manual_subscription(
  p_user_id   => '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid,
  p_full_name => 'موضي محمد البوعينين',
  p_tier      => 'quarterly'
);

-- ── 4) التحقّق ──
select
  'customer_subscriptions' as source,
  cs.user_id,
  cs.tier,
  cs.status,
  cs.payment_provider,
  cs.current_period_end,
  cs.updated_at
from public.customer_subscriptions cs
where cs.user_id = '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid;

select
  'profiles' as source,
  p.id,
  p.full_name,
  p.subscription_status,
  p.subscription_tier,
  p.tier,
  p.activated_at,
  p.expires_at
from public.profiles p
where p.id = '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid;

select
  'auth.users' as source,
  u.id,
  u.email,
  u.phone,
  u.created_at
from auth.users u
where u.id = '7c09a3c8-719d-430e-b43f-a257836acccd'::uuid;
