-- Manual subscription activation RPC
-- Used for VIP gifts, ops fixes, and offline payments where no provider webhook fires.
-- SECURITY DEFINER بحيث تتجاوز RLS وتكتب في جدولي customer_subscriptions و profiles.
-- استدعها فقط من سياق موثوق (Supabase SQL Editor بدور admin، أو endpoint محمي بـ requireAdmin).

create or replace function public.activate_manual_subscription(
  p_user_id uuid,
  p_full_name text default null,
  p_tier text default 'quarterly'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days int;
  v_now timestamptz := now();
begin
  -- تحديد المدة
  if p_tier = 'quarterly' then
    v_days := 90;
  elsif p_tier = 'yearly' then
    v_days := 365;
  else
    v_days := 30;
  end if;

  -- upsert في customer_subscriptions
  insert into public.customer_subscriptions (
    user_id,
    stripe_customer_id,
    status,
    tier,
    payment_provider,
    current_period_end,
    updated_at
  )
  values (
    p_user_id,
    coalesce('manual_' || p_user_id::text, 'manual'),
    'active',
    p_tier,
    'manual',
    v_now + (v_days || ' days')::interval,
    v_now
  )
  on conflict (user_id) do update
  set
    status = 'active',
    tier = excluded.tier,
    payment_provider = 'manual',
    current_period_end = excluded.current_period_end,
    updated_at = v_now;

  -- تحديث profiles
  update public.profiles
  set
    subscription_status = 'active',
    subscription_tier = p_tier,
    tier = p_tier,
    activated_at = v_now,
    expires_at = v_now + (v_days || ' days')::interval,
    full_name = coalesce(p_full_name, full_name),
    updated_at = v_now
  where id = p_user_id;

end;
$$;

-- صلاحية الاستدعاء: service_role فقط (Supabase admin client)
revoke execute on function public.activate_manual_subscription(uuid, text, text) from public;
revoke execute on function public.activate_manual_subscription(uuid, text, text) from anon, authenticated;
grant  execute on function public.activate_manual_subscription(uuid, text, text) to service_role;
