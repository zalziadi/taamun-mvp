create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create index if not exists idx_admins_email on public.admins (email);

alter table public.admins enable row level security;

drop policy if exists "admins can read own row" on public.admins;
create policy "admins can read own row"
on public.admins
for select
to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
