create table if not exists public.ramadan_verses (
  program_key text not null,
  version int not null,
  day int not null check (day between 1 and 28),
  surah int not null,
  ayah_start int not null,
  ayah_end int not null,
  theme text not null,
  observe_q text not null,
  insight_q text not null,
  contemplate_q text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (program_key, version, day)
);

alter table public.ramadan_verses
  add column if not exists program_key text,
  add column if not exists version int,
  add column if not exists surah int,
  add column if not exists ayah_start int,
  add column if not exists ayah_end int,
  add column if not exists theme text,
  add column if not exists observe_q text,
  add column if not exists insight_q text,
  add column if not exists contemplate_q text;

do $$
declare
  pk_name text;
begin
  select c.conname
  into pk_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'ramadan_verses'
    and c.contype = 'p';

  if pk_name is not null and pk_name <> 'ramadan_verses_pkey' then
    execute format('alter table public.ramadan_verses drop constraint %I', pk_name);
  end if;
exception
  when others then
    null;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'ramadan_verses' and column_name = 'surah_number'
  ) then
    update public.ramadan_verses
    set surah = coalesce(surah, surah_number)
    where surah is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'ramadan_verses' and column_name = 'ayah_number'
  ) then
    update public.ramadan_verses
    set ayah_start = coalesce(ayah_start, ayah_number),
        ayah_end = coalesce(ayah_end, ayah_number)
    where ayah_start is null or ayah_end is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'ramadan_verses' and column_name = 'theme_title'
  ) then
    update public.ramadan_verses
    set theme = coalesce(theme, theme_title)
    where theme is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'ramadan_verses' and column_name = 'prompt_observe'
  ) then
    update public.ramadan_verses
    set observe_q = coalesce(observe_q, prompt_observe)
    where observe_q is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'ramadan_verses' and column_name = 'prompt_insight'
  ) then
    update public.ramadan_verses
    set insight_q = coalesce(insight_q, prompt_insight)
    where insight_q is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'ramadan_verses' and column_name = 'prompt_contemplate'
  ) then
    update public.ramadan_verses
    set contemplate_q = coalesce(contemplate_q, prompt_contemplate)
    where contemplate_q is null;
  end if;
end $$;

update public.ramadan_verses
set
  program_key = coalesce(program_key, 'taamun-ramadan-28'),
  version = coalesce(version, 1)
where program_key is null or version is null;

alter table public.ramadan_verses
  alter column program_key set not null,
  alter column version set not null,
  alter column surah set not null,
  alter column ayah_start set not null,
  alter column ayah_end set not null,
  alter column theme set not null,
  alter column observe_q set not null,
  alter column insight_q set not null,
  alter column contemplate_q set not null;

create unique index if not exists ramadan_verses_program_version_day_uniq
  on public.ramadan_verses (program_key, version, day);
