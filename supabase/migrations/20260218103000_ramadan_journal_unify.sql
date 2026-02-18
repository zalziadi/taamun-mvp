create extension if not exists pgcrypto;

create table if not exists public.ramadan_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_key text not null default 'taamun-ramadan-28',
  version int not null default 1,
  day int not null check (day between 1 and 28),
  observe text not null default '',
  insight text not null default '',
  contemplate text not null default '',
  rebuild text not null default '',
  ai_response text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ramadan_journal
  add column if not exists observe text not null default '',
  add column if not exists insight text not null default '',
  add column if not exists contemplate text not null default '',
  add column if not exists rebuild text not null default '',
  add column if not exists ai_response text not null default '',
  add column if not exists program_key text not null default 'taamun-ramadan-28',
  add column if not exists version int not null default 1,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'ramadan_journal_user_program_version_day_idx'
  ) then
    create unique index ramadan_journal_user_program_version_day_idx
      on public.ramadan_journal (user_id, program_key, version, day);
  end if;
end $$;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_ramadan_journal_updated_at'
  ) then
    create trigger set_ramadan_journal_updated_at
      before update on public.ramadan_journal
      for each row
      execute function public.set_updated_at_timestamp();
  end if;
end $$;

create or replace view public.ramadan_responses as
select
  user_id,
  program_key,
  version,
  day,
  observe as observe_text,
  insight as insight_text,
  contemplate as contemplate_text,
  rebuild as rebuild_text,
  ai_response,
  created_at,
  updated_at
from public.ramadan_journal;

alter table public.ramadan_journal enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ramadan_journal'
      and policyname = 'ramadan_journal_select_own'
  ) then
    create policy ramadan_journal_select_own
      on public.ramadan_journal
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ramadan_journal'
      and policyname = 'ramadan_journal_insert_own'
  ) then
    create policy ramadan_journal_insert_own
      on public.ramadan_journal
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ramadan_journal'
      and policyname = 'ramadan_journal_update_own'
  ) then
    create policy ramadan_journal_update_own
      on public.ramadan_journal
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
