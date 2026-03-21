-- Stripe subscription mirror for entitlements (updated via webhook with service role)

create table if not exists public.customer_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  price_id text,
  tier text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_subscriptions_stripe_sub
  on public.customer_subscriptions (stripe_subscription_id);

alter table public.customer_subscriptions enable row level security;

create policy "customer_subscriptions_select_own"
  on public.customer_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.customer_subscriptions is 'Synced from Stripe webhooks; do not write from client.';
