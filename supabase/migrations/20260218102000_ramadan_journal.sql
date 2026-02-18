-- supabase/migrations/20260218102000_ramadan_journal.sql
-- جدول حفظ إجابات المستخدم + رد AI

create table if not exists public.ramadan_journal (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  day          int  not null check (day between 1 and 28),
  observe      text,
  insight      text,
  contemplate  text,
  rebuild      text,
  ai_response  text,
  created_at   timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists idx_ramadan_journal_user
on public.ramadan_journal (user_id, day);
