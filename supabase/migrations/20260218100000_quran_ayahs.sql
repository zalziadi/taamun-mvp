create table if not exists public.quran_ayahs (
  id bigserial primary key,
  surah int not null,
  ayah int not null,
  text_ar text not null,
  page int,
  juz int,
  hizb int,
  created_at timestamptz not null default now()
);

alter table public.quran_ayahs
  add column if not exists surah int,
  add column if not exists ayah int,
  add column if not exists text_ar text,
  add column if not exists page int,
  add column if not exists juz int,
  add column if not exists hizb int;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_ayahs' and column_name = 'surah_number'
  ) then
    update public.quran_ayahs
    set surah = coalesce(surah, surah_number)
    where surah is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_ayahs' and column_name = 'ayah_number'
  ) then
    update public.quran_ayahs
    set ayah = coalesce(ayah, ayah_number)
    where ayah is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_ayahs' and column_name = 'arabic_text'
  ) then
    update public.quran_ayahs
    set text_ar = coalesce(text_ar, arabic_text)
    where text_ar is null;
  end if;
end $$;

alter table public.quran_ayahs
  alter column surah set not null,
  alter column ayah set not null,
  alter column text_ar set not null;

create unique index if not exists quran_ayahs_surah_ayah_uniq
  on public.quran_ayahs (surah, ayah);

create index if not exists quran_ayahs_surah_ayah_idx
  on public.quran_ayahs (surah, ayah);
