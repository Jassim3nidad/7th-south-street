create or replace function public.admin_create_product(p_product jsonb)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public
as $$
  select public.admin_save_product(null, p_product);
$$;

revoke all on function public.admin_create_product(jsonb) from public, anon;
grant execute on function public.admin_create_product(jsonb) to authenticated, service_role;
