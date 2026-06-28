-- لمة وفرة — جدول التقاط البريد (اختياري · سقوط آمن إن غاب)
-- التطبيق يعمل بدون هذا الجدول؛ عند توفّر مفاتيح Supabase تُحفظ leads هنا.
-- الكتابة تمرّ عبر service role في /api/lead فقط (يتجاوز RLS) — لا سياسات عامة.

create table if not exists public.wafrah_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  source text not null default 'wafrah-funnel',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wafrah_leads_email_idx
  on public.wafrah_leads (email);

alter table public.wafrah_leads enable row level security;
