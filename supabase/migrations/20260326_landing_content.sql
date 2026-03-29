-- ═══════════════════════════════════════════════════
-- Taamun V2 Landing — Dynamic Content Tables
-- Run once in Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. آية اليوم (تتغير يومياً)
create table if not exists daily_verse (
  id uuid default gen_random_uuid() primary key,
  arabic text not null,
  translation text not null,
  source text not null,
  active_date date not null unique,
  created_at timestamptz default now()
);

-- 2. آيات البوست الاجتماعي
create table if not exists social_verses (
  id uuid default gen_random_uuid() primary key,
  arabic text not null,
  translation text not null,
  source text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. المجالات التسعة
create table if not exists domains (
  id uuid default gen_random_uuid() primary key,
  order_index int not null unique,
  name_ar text not null,
  name_en text not null,
  icon_key text not null,
  created_at timestamptz default now()
);

-- 4. نصوص الأقسام
create table if not exists page_content (
  id uuid default gen_random_uuid() primary key,
  section_key text not null unique,
  content_ar text not null,
  content_en text,
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════
-- RLS Policies — public read for anon
-- ═══════════════════════════════════════════════════

alter table daily_verse enable row level security;
create policy "public read" on daily_verse for select using (true);

alter table social_verses enable row level security;
create policy "public read" on social_verses for select using (true);

alter table domains enable row level security;
create policy "public read" on domains for select using (true);

alter table page_content enable row level security;
create policy "public read" on page_content for select using (true);

-- ═══════════════════════════════════════════════════
-- Seed Data
-- ═══════════════════════════════════════════════════

-- المجالات التسعة
insert into domains (order_index, name_ar, name_en, icon_key) values
(1, 'الهوية',   'Identity',      'identity'),
(2, 'العلاقات', 'Relationships', 'relationships'),
(3, 'المال',    'Provision',     'provision'),
(4, 'النمو',    'Growth',        'growth'),
(5, 'العطاء',   'Giving',        'giving'),
(6, 'الجمال',   'Beauty',        'beauty'),
(7, 'الأسرة',   'Family',        'family'),
(8, 'البناء',   'Building',      'building'),
(9, 'المراجعة', 'Reflection',    'reflection')
on conflict (order_index) do nothing;

-- نصوص الأقسام
insert into page_content (section_key, content_ar, content_en) values
('metaphor_quote',
 'ليس في الوجود إلا نور واحد، يتجلّى في صور شتى، كالعصا التي يسند إليها المسافر قلبه قبل جسده.',
 null),
('staff_meaning',
 'تمعّن ليست أداة — هي كيان راسخ. لها ظِل لأنها قائمة بالفعل. تسند المسافر لا لأنها تحمله، بل لأنها تذكّره أنه لم يسقط.',
 null),
('shadow_meaning',
 'لا تحتاج أن تصرخ — وجودك كافٍ لأن يكون لك انعكاس في الواقع. الظل هو الدليل الأصدق على أن النور وقع.',
 null),
('light_meaning',
 'النور لا يأتي من تمعّن — يأتي من مكان أعلى. تمعّن هي ما يستقبله ويعكسه. القرآن هو المصدر؛ التأمل هو الانكسار.',
 null),
('stones_meaning',
 'تسعة مجالات تحيط بالمحور — لكل حجر ثقله ووزنه وموضعه في الطريق. المسافر لا يحمل الحجارة — يمشي بينها.',
 null),
('journey_intro',
 'كلما تقدّمت في رحلتك — تحوّل اللون من ذهبي الظل إلى أزرق أفضل الاحتمال.',
 null),
('domains_verse',
 'كل حجر بابٌ — والعصا هي المحور الذي لا يتزعزع',
 null),
('icons_intro',
 'تسعة أبواب. كل باب عالَم. لا تدخله بعقلك — بل بوجودك.',
 null)
on conflict (section_key) do nothing;
