create table if not exists public.salla_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  merchant_id text,
  merchant_domain text,
  access_token text not null,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.salla_connections enable row level security;

create policy "users can read own salla connection"
on public.salla_connections
for select
to authenticated
using (auth.uid() = user_id);
