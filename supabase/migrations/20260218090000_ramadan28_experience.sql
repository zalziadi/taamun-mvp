create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quran_ayahs (
  id bigserial primary key,
  surah_number int not null,
  ayah_number int not null,
  arabic_text text not null,
  normalized_key text generated always as ((surah_number::text || ':' || ayah_number::text)) stored,
  created_at timestamptz not null default now(),
  unique (normalized_key)
);

create index if not exists idx_quran_ayahs_surah_ayah
  on public.quran_ayahs (surah_number, ayah_number);

create table if not exists public.ramadan_verses (
  day int primary key,
  surah_number int not null,
  ayah_number int not null,
  theme_title text,
  prompt_observe text,
  prompt_insight text,
  prompt_contemplate text,
  prompt_rebuild text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_day int not null default 1 check (current_day between 1 and 28),
  completed_days int[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day int not null check (day between 1 and 28),
  observe text not null default '',
  insight text not null default '',
  contemplate text not null default '',
  rebuild text,
  ai_reflection text,
  ai_response jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists idx_user_answers_user_day
  on public.user_answers (user_id, day);

create table if not exists public.awareness_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_number int check (week_number between 1 and 4),
  insight_type text not null check (insight_type in ('weekly', 'final')),
  insight_text text not null,
  clarity int not null default 0 check (clarity between 0 and 100),
  responsibility int not null default 0 check (responsibility between 0 and 100),
  trust int not null default 0 check (trust between 0 and 100),
  surrender int not null default 0 check (surrender between 0 and 100),
  evolution jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, insight_type, week_number)
);

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_answers enable row level security;
alter table public.awareness_insights enable row level security;
alter table public.quran_ayahs enable row level security;
alter table public.ramadan_verses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own'
  ) then
    create policy profiles_select_own on public.profiles
      for select to authenticated using (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own'
  ) then
    create policy profiles_update_own on public.profiles
      for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_progress' and policyname = 'user_progress_owner'
  ) then
    create policy user_progress_owner on public.user_progress
      for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_answers' and policyname = 'user_answers_owner'
  ) then
    create policy user_answers_owner on public.user_answers
      for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'awareness_insights' and policyname = 'awareness_owner'
  ) then
    create policy awareness_owner on public.awareness_insights
      for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'quran_ayahs' and policyname = 'quran_read_authenticated'
  ) then
    create policy quran_read_authenticated on public.quran_ayahs
      for select to authenticated using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ramadan_verses' and policyname = 'ramadan_verses_read_authenticated'
  ) then
    create policy ramadan_verses_read_authenticated on public.ramadan_verses
      for select to authenticated using (true);
  end if;
end $$;
