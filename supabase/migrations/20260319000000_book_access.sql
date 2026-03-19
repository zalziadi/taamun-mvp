alter table public.profiles
  add column if not exists book_access boolean not null default false,
  add column if not exists book_activated_at timestamptz;
