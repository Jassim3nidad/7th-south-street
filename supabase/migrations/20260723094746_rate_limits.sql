create table public.rate_limits (
  ip_hash text not null,
  endpoint text not null,
  hits integer not null default 1,
  last_reset timestamptz not null default now(),
  primary key (ip_hash, endpoint)
);

-- Enable RLS but since this table is only managed via security definer RPCs, no policies are needed
alter table public.rate_limits enable row level security;

create or replace function public.check_rate_limit(
  p_ip_hash text,
  p_endpoint text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_hits integer;
  v_last_reset timestamptz;
begin
  select hits, last_reset into v_hits, v_last_reset
  from public.rate_limits
  where ip_hash = p_ip_hash and endpoint = p_endpoint
  for update;

  if not found then
    insert into public.rate_limits (ip_hash, endpoint, hits, last_reset)
    values (p_ip_hash, p_endpoint, 1, now());
    return true;
  end if;

  if now() - v_last_reset > make_interval(secs := p_window_seconds) then
    update public.rate_limits
    set hits = 1, last_reset = now()
    where ip_hash = p_ip_hash and endpoint = p_endpoint;
    return true;
  end if;

  if v_hits < p_limit then
    update public.rate_limits
    set hits = hits + 1
    where ip_hash = p_ip_hash and endpoint = p_endpoint;
    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.check_rate_limit(text, text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, text, integer, integer) to anon, authenticated, service_role;

comment on table public.rate_limits is 'Tracks API rate limits to prevent brute-force and spam attacks.';
comment on function public.check_rate_limit(text, text, integer, integer) is 'Checks and increments rate limits securely. Returns false if the limit is exceeded.';
