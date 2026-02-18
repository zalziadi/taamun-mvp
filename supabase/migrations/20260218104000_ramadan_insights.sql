create extension if not exists pgcrypto;

create table if not exists public.ramadan_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_key text not null,
  version int not null,
  type text not null check (type in ('weekly', 'final')),
  week int null check (week between 1 and 4),
  dominant_pattern text,
  shadow text,
  gift text,
  best_potential text,
  advice text,
  clarity_score int not null check (clarity_score between 0 and 100),
  responsibility_score int not null check (responsibility_score between 0 and 100),
  trust_score int not null check (trust_score between 0 and 100),
  surrender_score int not null check (surrender_score between 0 and 100),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  evolution jsonb,
  transformation_summary text,
  created_at timestamptz not null default now(),
  unique (user_id, program_key, version, type, week)
);

alter table public.ramadan_insights
  add column if not exists evolution jsonb,
  add column if not exists transformation_summary text;

alter table public.ramadan_insights enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ramadan_insights'
      and policyname = 'ramadan_insights_select_own'
  ) then
    create policy ramadan_insights_select_own
      on public.ramadan_insights
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
      and tablename = 'ramadan_insights'
      and policyname = 'ramadan_insights_insert_own'
  ) then
    create policy ramadan_insights_insert_own
      on public.ramadan_insights
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
      and tablename = 'ramadan_insights'
      and policyname = 'ramadan_insights_update_own'
  ) then
    create policy ramadan_insights_update_own
      on public.ramadan_insights
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
