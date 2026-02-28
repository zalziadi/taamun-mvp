alter table public.user_answers
  add column if not exists observed_track text not null default 'surface',
  add column if not exists insight_track text not null default 'surface',
  add column if not exists contemplation_track text not null default 'surface';

alter table public.user_answers
  drop constraint if exists user_answers_observed_track_check,
  drop constraint if exists user_answers_insight_track_check,
  drop constraint if exists user_answers_contemplation_track_check;

alter table public.user_answers
  add constraint user_answers_observed_track_check
    check (observed_track in ('surface', 'mirror')),
  add constraint user_answers_insight_track_check
    check (insight_track in ('surface', 'mirror')),
  add constraint user_answers_contemplation_track_check
    check (contemplation_track in ('surface', 'mirror'));
