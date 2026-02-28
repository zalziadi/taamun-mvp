create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  day integer not null check (day >= 1 and day <= 28),
  observed text not null default '',
  insight text not null default '',
  contemplation text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists idx_user_answers_user_id on public.user_answers(user_id);
create index if not exists idx_user_answers_day on public.user_answers(day);
