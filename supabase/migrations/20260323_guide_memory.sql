-- Guide Memory + Sessions schema
-- Run: supabase db push  OR  supabase migration up

create table if not exists user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  patterns text[] default '{}',
  awareness_level text default 'surface'
    check (awareness_level in ('surface','growing','deep')),
  commitment_score integer default 0
    check (commitment_score between 0 and 10),
  last_topic text,
  last_action_taken boolean default false,
  current_day integer default 1,
  conversion_stage text default 'cold'
    check (conversion_stage in ('cold','aware','engaged','ready','converted')),
  actions_completed integer default 0,
  updated_at timestamptz default now(),
  unique(user_id)
);

create table if not exists guide_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  day integer not null,
  messages jsonb not null default '[]',
  insight text,
  action_given text,
  action_taken boolean,
  created_at timestamptz default now()
);

alter table user_memory enable row level security;
alter table guide_sessions enable row level security;

create policy "own_memory" on user_memory
  for all using (auth.uid() = user_id);

create policy "own_sessions" on guide_sessions
  for all using (auth.uid() = user_id);

-- Index for fast lookup
create index if not exists idx_memory_user on user_memory(user_id);
create index if not exists idx_sessions_user_day on guide_sessions(user_id, day);
