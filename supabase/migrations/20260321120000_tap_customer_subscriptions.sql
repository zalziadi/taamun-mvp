-- Tap Payments: تخزين مرجع الدفع بجانب Stripe

alter table public.customer_subscriptions
  add column if not exists payment_provider text not null default 'stripe';

alter table public.customer_subscriptions
  add column if not exists tap_charge_id text;

create unique index if not exists idx_customer_subscriptions_tap_charge
  on public.customer_subscriptions (tap_charge_id)
  where tap_charge_id is not null;

comment on column public.customer_subscriptions.payment_provider is 'stripe | tap';
comment on column public.customer_subscriptions.tap_charge_id is 'آخر charge ناجح من Tap (إن وُجد)';
