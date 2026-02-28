create extension if not exists pgcrypto;

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null,
  title text not null,
  unit_amount integer not null check (unit_amount >= 0),
  currency text not null default 'sar',
  qty integer not null default 1 check (qty > 0),
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_key)
);

create index if not exists idx_cart_items_user_id on public.cart_items(user_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  total_amount integer not null default 0 check (total_amount >= 0),
  currency text not null default 'sar',
  stripe_session_id text unique,
  stripe_payment_intent text,
  activation_code text,
  entitlement_activated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null,
  title text not null,
  unit_amount integer not null check (unit_amount >= 0),
  currency text not null default 'sar',
  qty integer not null default 1 check (qty > 0),
  line_total integer not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_user_id on public.order_items(user_id);

alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Cart owner read" on public.cart_items;
drop policy if exists "Cart owner write" on public.cart_items;
create policy "Cart owner read"
on public.cart_items
for select
using (auth.uid() = user_id);
create policy "Cart owner write"
on public.cart_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Order owner read" on public.orders;
drop policy if exists "Order owner write" on public.orders;
create policy "Order owner read"
on public.orders
for select
using (auth.uid() = user_id);
create policy "Order owner write"
on public.orders
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Order item owner read" on public.order_items;
drop policy if exists "Order item owner write" on public.order_items;
create policy "Order item owner read"
on public.order_items
for select
using (auth.uid() = user_id);
create policy "Order item owner write"
on public.order_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
