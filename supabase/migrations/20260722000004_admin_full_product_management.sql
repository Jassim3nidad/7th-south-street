create or replace function public.admin_save_product(
  p_product_id bigint,
  p_product jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_product_id bigint;
  v_name text := btrim(coalesce(p_product ->> 'name', ''));
  v_slug text;
  v_sku text := upper(btrim(coalesce(p_product ->> 'sku', '')));
  v_price numeric(12, 2);
  v_compare_at_price numeric(12, 2);
  v_variant jsonb;
  v_variant_id bigint;
  v_variant_ids_kept bigint[] := array[]::bigint[];
  v_has_sizes boolean := coalesce((p_product ->> 'has_sizes')::boolean, true);
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if v_name = '' or v_sku = '' then
    raise exception 'Product name and SKU are required' using errcode = '22023';
  end if;

  v_slug := coalesce(
    nullif(btrim(p_product ->> 'slug'), ''),
    trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'))
  );
  v_price := (p_product ->> 'price')::numeric(12, 2);
  v_compare_at_price := nullif(p_product ->> 'compare_price', '')::numeric(12, 2);

  if p_product_id is null then
    insert into public.products (
      category_id, name, slug, description, status, is_featured, has_sizes,
      meta_title, meta_description
    ) values (
      nullif(p_product ->> 'category_id', '')::bigint,
      v_name,
      v_slug,
      nullif(p_product ->> 'description', ''),
      coalesce(nullif(p_product ->> 'status', ''), 'available')::public.product_status,
      coalesce((p_product ->> 'is_featured')::boolean, false),
      v_has_sizes,
      nullif(p_product ->> 'meta_title', ''),
      nullif(p_product ->> 'meta_description', '')
    ) returning id into v_product_id;
  else
    update public.products
    set category_id = nullif(p_product ->> 'category_id', '')::bigint,
        name = v_name,
        slug = v_slug,
        description = nullif(p_product ->> 'description', ''),
        status = coalesce(nullif(p_product ->> 'status', ''), 'available')::public.product_status,
        is_featured = coalesce((p_product ->> 'is_featured')::boolean, false),
        has_sizes = v_has_sizes,
        meta_title = nullif(p_product ->> 'meta_title', ''),
        meta_description = nullif(p_product ->> 'meta_description', '')
    where id = p_product_id
    returning id into v_product_id;

    if v_product_id is null then
      raise exception 'Product not found' using errcode = 'P0002';
    end if;
  end if;

  if p_product ? 'variants' and jsonb_typeof(p_product -> 'variants') = 'array' then
    for v_variant in select * from jsonb_array_elements(p_product -> 'variants')
    loop
      if (v_variant ->> 'id') is not null then
        update public.product_variants
        set
          sku = upper(btrim(coalesce(v_variant ->> 'sku', ''))),
          size = btrim(coalesce(v_variant ->> 'size', '')),
          price = (v_variant ->> 'price')::numeric(12, 2),
          compare_at_price = nullif(v_variant ->> 'compare_at_price', '')::numeric(12, 2),
          stock_quantity = coalesce((v_variant ->> 'stock_quantity')::integer, 0),
          is_active = coalesce((v_variant ->> 'is_active')::boolean, true)
        where id = (v_variant ->> 'id')::bigint and product_id = v_product_id
        returning id into v_variant_id;
        
        if v_variant_id is not null then
          v_variant_ids_kept := array_append(v_variant_ids_kept, v_variant_id);
        end if;
      else
        insert into public.product_variants (
          product_id, sku, size, price, compare_at_price, stock_quantity, is_active
        ) values (
          v_product_id,
          upper(btrim(coalesce(v_variant ->> 'sku', ''))),
          btrim(coalesce(v_variant ->> 'size', '')),
          (v_variant ->> 'price')::numeric(12, 2),
          nullif(v_variant ->> 'compare_at_price', '')::numeric(12, 2),
          coalesce((v_variant ->> 'stock_quantity')::integer, 0),
          coalesce((v_variant ->> 'is_active')::boolean, true)
        ) returning id into v_variant_id;

        v_variant_ids_kept := array_append(v_variant_ids_kept, v_variant_id);
      end if;
    end loop;

    -- Deactivate variants that were omitted from the array
    update public.product_variants
    set is_active = false
    where product_id = v_product_id
      and not (id = any(v_variant_ids_kept));

  else
    -- Fallback to the old logic if variants array isn't provided
    if p_product_id is null then
      insert into public.product_variants (
        product_id, sku, size, price, compare_at_price, stock_quantity
      ) values (
        v_product_id, v_sku, 'OS', v_price, v_compare_at_price, 0
      );
    else
      update public.product_variants
      set price = v_price, compare_at_price = v_compare_at_price
      where product_id = v_product_id;

      select id into v_variant_id
      from public.product_variants
      where product_id = v_product_id
      order by id limit 1;

      if v_variant_id is null then
        insert into public.product_variants (
          product_id, sku, size, price, compare_at_price, stock_quantity
        ) values (
          v_product_id, v_sku, 'OS', v_price, v_compare_at_price, 0
        );
      else
        update public.product_variants set sku = v_sku where id = v_variant_id;
      end if;
    end if;
  end if;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    case when p_product_id is null then 'product.created' else 'product.updated' end,
    'product',
    v_product_id::text,
    jsonb_build_object('name', v_name, 'sku', v_sku)
  );

  return jsonb_build_object('id', v_product_id);
end;
$$;

create or replace function public.admin_reorder_product_images(
  p_product_id bigint,
  p_image_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id bigint;
  v_idx integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  foreach v_id in array p_image_ids
  loop
    update public.product_images
    set sort_order = v_idx,
        is_primary = (v_idx = 0)
    where id = v_id and product_id = p_product_id;
    v_idx := v_idx + 1;
  end loop;
end;
$$;

revoke all on function public.admin_reorder_product_images(bigint, bigint[]) from public, anon;
grant execute on function public.admin_reorder_product_images(bigint, bigint[]) to authenticated, service_role;
