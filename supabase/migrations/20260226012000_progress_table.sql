create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_day int not null default 1 check (current_day between 1 and 28),
  completed_days int[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'progress' and policyname = 'progress_owner'
  ) then
    create policy progress_owner on public.progress
      for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.user_progress') is not null then
    insert into public.progress (user_id, current_day, completed_days, updated_at, created_at)
    select user_id, current_day, completed_days, updated_at, created_at
    from public.user_progress
    on conflict (user_id) do nothing;
  end if;
end $$;
