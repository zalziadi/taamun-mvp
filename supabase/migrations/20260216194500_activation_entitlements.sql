create extension if not exists pgcrypto;

create table if not exists public.activation_codes (
  code text primary key,
  plan text not null,
  max_uses integer not null default 1 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_activation_codes_plan on public.activation_codes(plan);
create index if not exists idx_activation_codes_expires_at on public.activation_codes(expires_at);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  activation_code text not null unique references public.activation_codes(code) on delete cascade,
  plan text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists idx_entitlements_status on public.entitlements(status);
create index if not exists idx_entitlements_plan on public.entitlements(plan);
create index if not exists idx_entitlements_ends_at on public.entitlements(ends_at);

create or replace function public.consume_activation_code(p_code text)
returns table (
  ok boolean,
  error text,
  plan text,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.activation_codes%rowtype;
begin
  if p_code is null or btrim(p_code) = '' then
    return query select false, 'missing_code', null::text, null::timestamptz;
    return;
  end if;

  select *
    into v_code
    from public.activation_codes
   where code = upper(btrim(p_code))
   for update;

  if not found then
    return query select false, 'not_found', null::text, null::timestamptz;
    return;
  end if;

  if v_code.expires_at is not null and v_code.expires_at <= now() then
    return query select false, 'expired', null::text, null::timestamptz;
    return;
  end if;

  if v_code.uses >= v_code.max_uses then
    return query select false, 'used', null::text, null::timestamptz;
    return;
  end if;

  update public.activation_codes
     set uses = uses + 1
   where code = v_code.code;

  return query
    select
      true,
      null::text,
      v_code.plan,
      now() + interval '30 days';
end;
$$;
