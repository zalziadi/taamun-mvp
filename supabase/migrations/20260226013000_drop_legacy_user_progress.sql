-- Finalize migration from legacy `user_progress` to `progress`.
-- Safe to run multiple times.

do $$
begin
  -- Last safety copy before dropping legacy table.
  if to_regclass('public.progress') is not null and to_regclass('public.user_progress') is not null then
    insert into public.progress (user_id, current_day, completed_days, updated_at, created_at)
    select user_id, current_day, completed_days, updated_at, created_at
    from public.user_progress
    on conflict (user_id) do update
      set current_day = excluded.current_day,
          completed_days = excluded.completed_days,
          updated_at = excluded.updated_at;
  end if;
end $$;

drop table if exists public.user_progress;
