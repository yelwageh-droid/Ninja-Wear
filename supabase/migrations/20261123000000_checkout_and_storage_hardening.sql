-- ============================================================================
-- Ninja Wear — Checkout & storage hardening (additive, safe to re-run)
-- إصلاحات تسعير الطلبات وتأمين الرفع والتخزين على قاعدة البيانات الحية
--
-- Run this migration in Supabase SQL Editor after the earlier migrations.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Backfill existing auth users so legacy accounts get a profile/role.
--    The signup trigger only covers users created after it was installed.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, full_name)
select u.id,
       coalesce(u.email, ''),
       coalesce(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
on conflict (id) do nothing;

insert into public.user_roles (user_id, role, permissions)
select u.id, 'user', '{}'::text[]
from auth.users u
where not exists (select 1 from public.user_roles r where r.user_id = u.id);

-- ---------------------------------------------------------------------------
-- 2) The order RPC is the only writer: prices, status and cart groups are
--    calculated on the server, never trusted from the browser.
-- ---------------------------------------------------------------------------
create or replace function public.submit_customer_order(
  p_items            jsonb,
  p_customer_name    text,
  p_customer_email   text,
  p_customer_phone   text,
  p_customer_address text,
  p_secondary_phone  text default null,
  p_cart_group_id    uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item         jsonb;
  v_group_id     uuid := gen_random_uuid();
  v_base_price   numeric := 0;
  v_print_price  numeric := 0;
  v_logo_price   numeric := 0;
  v_quantity     integer := 1;
  v_unit_price   numeric := 0;
  v_total_price  numeric := 0;
  v_product_info text;
  v_details      jsonb;
  v_design_path  text;
  v_logo_path    text;
  v_owner_prefix text := auth.uid()::text || '/';
  v_option_id    text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to place an order.' using errcode = '28000';
  end if;

  if not public.is_account_active(auth.uid()) then
    raise exception 'This account is not allowed to place new orders.' using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'The cart is empty.' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := least(greatest(coalesce(nullif(v_item ->> 'quantity', '')::integer, 1), 1), 100);

    -- Only active catalogue rows may be ordered / الطلبات من المنتجات الفعّالة فقط
    select p.base_price into v_base_price
      from public.apparel_products p
     where p.id::text = v_item ->> 'product_id'
       and p.is_active;

    if not found then
      raise exception 'Unknown or inactive product in the cart: %', coalesce(v_item ->> 'product_id', '?')
        using errcode = '22023';
    end if;

    v_print_price := 0;
    select coalesce(o.additional_price, 0) into v_print_price
      from public.print_options o
     where o.id::text = coalesce(v_item ->> 'print_option_id', '')
       and o.is_active
     limit 1;
    v_print_price := coalesce(v_print_price, 0);

    v_logo_price := 0;
    v_option_id := coalesce(v_item ->> 'logo_option_id', '');
    -- Client sends the option_type; also accept a UUID for older carts.
    select coalesce(o.additional_price, 0) into v_logo_price
      from public.logo_options o
     where (o.id::text = v_option_id or o.option_type = v_option_id)
       and o.is_active
     order by o.id
     limit 1;
    v_logo_price := coalesce(v_logo_price, 0);

    v_unit_price  := coalesce(v_base_price, 0) + v_print_price + v_logo_price;
    v_total_price := v_unit_price * v_quantity;

    v_product_info := concat_ws(' · ',
      nullif(v_item ->> 'category', ''),
      nullif(v_item ->> 'fit_type', ''),
      nullif(v_item ->> 'size', ''),
      nullif(v_item ->> 'color', ''),
      'Qty ' || v_quantity
    );

    v_details := coalesce(v_item -> 'order_details', '{}'::jsonb);

    -- Uploaded artwork paths must live under the caller's UID prefix.
    -- مسارات الملفات المرفوعة يجب أن تكون داخل مجلد المستخدم صاحب الطلب فقط
    v_design_path := v_details ->> 'design_image_path';
    v_logo_path := v_details ->> 'logo_image_path';
    if (v_design_path is not null and v_design_path not like v_owner_prefix || '%')
       or (v_logo_path is not null and v_logo_path not like v_owner_prefix || '%') then
      raise exception 'Uploaded artwork does not belong to this account.'
        using errcode = '42501';
    end if;

    v_details := v_details || jsonb_build_object(
      'unit_price', v_unit_price,
      'garment_quantity', v_quantity,
      'secondary_phone', nullif(p_secondary_phone, '')
    );

    insert into public.orders (
      customer_id, customer_name, customer_email, customer_phone, customer_address,
      product_info, design_name, print_option, logo_option, total_price, status,
      cart_group_id, created_at, order_details
    ) values (
      auth.uid(),
      coalesce(p_customer_name, ''),
      coalesce(p_customer_email, ''),
      coalesce(p_customer_phone, ''),
      coalesce(p_customer_address, ''),
      v_product_info,
      coalesce(v_item ->> 'design_name', ''),
      coalesce(v_item ->> 'print_option', ''),
      coalesce(v_item ->> 'logo_option', ''),
      v_total_price,
      'Pending',
      v_group_id,
      now(),
      v_details
    );
  end loop;

  return v_group_id;
end;
$$;

revoke all on function public.submit_customer_order(jsonb, text, text, text, text, text, uuid) from public;
grant execute on function public.submit_customer_order(jsonb, text, text, text, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Direct table writes must not bypass the RPC and its price calculation.
-- ---------------------------------------------------------------------------
revoke insert on public.orders from anon, authenticated;
revoke update on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Helper functions must not be callable anonymously to probe roles/status.
-- ---------------------------------------------------------------------------
revoke all on function public.is_staff(uuid) from public;
revoke all on function public.is_super_admin(uuid) from public;
revoke all on function public.has_permission(uuid, text) from public;
revoke all on function public.is_account_active(uuid) from public;
grant execute on function public.is_staff(uuid) to authenticated;
grant execute on function public.is_super_admin(uuid) to authenticated;
grant execute on function public.has_permission(uuid, text) to authenticated;
grant execute on function public.is_account_active(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Admins with customers.manage must not freeze/ban staff accounts.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_profile_escalation()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- A null auth.uid() means a trusted SQL/service-role operation.
  if new.account_status is distinct from old.account_status and auth.uid() is not null then
    if not public.has_permission(auth.uid(), 'customers.manage')
       and not public.is_super_admin(auth.uid()) then
      raise exception 'Only staff with the customers.manage permission can change account status.';
    end if;
    if public.is_staff(old.id) and not public.is_super_admin(auth.uid()) then
      raise exception 'Only a super admin can change a staff account status.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) Storage: customer artwork is scoped to the signer's UID prefix, and
--    catalog/design buckets get explicit public-read + staff-write policies.
-- ---------------------------------------------------------------------------
drop policy if exists custom_uploads_insert on storage.objects;
create policy custom_uploads_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'custom_design_uploads'
    and public.is_account_active(auth.uid())
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists custom_uploads_customer_select on storage.objects;
create policy custom_uploads_customer_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'custom_design_uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.orders o
      where o.customer_id = auth.uid()
        and (
          o.order_details ->> 'design_image_path' = name
          or o.order_details ->> 'logo_image_path' = name
        )
    )
  );

drop policy if exists custom_uploads_owner_delete on storage.objects;
create policy custom_uploads_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'custom_design_uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists designs_public_read on storage.objects;
create policy designs_public_read on storage.objects
  for select using (bucket_id = 'designs');

drop policy if exists designs_staff_write on storage.objects;
create policy designs_staff_write on storage.objects
  for all to authenticated
  using (bucket_id = 'designs' and public.has_permission(auth.uid(), 'collections.manage'))
  with check (bucket_id = 'designs' and public.has_permission(auth.uid(), 'collections.manage'));

drop policy if exists mockups_public_read on storage.objects;
create policy mockups_public_read on storage.objects
  for select using (bucket_id = 'apparel-mockups');

drop policy if exists mockups_staff_write on storage.objects;
create policy mockups_staff_write on storage.objects
  for all to authenticated
  using (bucket_id = 'apparel-mockups' and public.has_permission(auth.uid(), 'catalog.manage'))
  with check (bucket_id = 'apparel-mockups' and public.has_permission(auth.uid(), 'catalog.manage'));

-- Keep exactly one active row per logo type so storefront and server agree on price.
alter table public.logo_options drop constraint if exists logo_options_option_type_key;
alter table public.logo_options add constraint logo_options_option_type_key unique (option_type);
