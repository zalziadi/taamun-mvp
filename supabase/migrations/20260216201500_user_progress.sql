create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  current_day integer not null default 1 check (current_day >= 1 and current_day <= 28),
  completed_days integer[] not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_progress_user_id on public.user_progress(user_id);
