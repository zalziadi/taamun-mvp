-- لمة وفرة — مخطّط Supabase (اختياري)
-- التطبيق يعمل بدون هذا الجدول معتمداً على LocalStorage فقط.
-- إذا أردت المزامنة عبر الأجهزة، طبّق هذا المخطّط في مشروع Supabase وضع متغيّرات البيئة.

create table if not exists public.wafrah_day_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  day smallint not null check (day between 1 and 14),
  answer text not null default '',
  reflection text not null default '',
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists wafrah_day_progress_user_idx
  on public.wafrah_day_progress (user_id);

alter table public.wafrah_day_progress enable row level security;

-- مثال سياسة RLS — عدّلها حسب نموذج المصادقة عندك
-- create policy "users can read own progress"
--   on public.wafrah_day_progress for select
--   using (auth.uid()::text = user_id);
--
-- create policy "users can upsert own progress"
--   on public.wafrah_day_progress for insert
--   with check (auth.uid()::text = user_id);
--
-- create policy "users can update own progress"
--   on public.wafrah_day_progress for update
--   using (auth.uid()::text = user_id);
