-- ============================================================================
-- Ninja Wear — Sprint 2: catalog RLS, customer secondary phone & server-side
-- order pricing / سياسات RLS للكتالوج، الرقم الاحتياطي، وتسعير الطلبات على السيرفر
--
-- Written to be additive and idempotent: safe to re-run on the live project.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Catalog RLS: public read + permission-gated staff writes
--    الكتالوج متاح للقراءة العامة، والكتابة لأصحاب الصلاحيات فقط
-- ---------------------------------------------------------------------------
alter table public.apparel_products enable row level security;
alter table public.design_collections enable row level security;
alter table public.print_options enable row level security;
alter table public.logo_options enable row level security;

-- apparel_products -> catalog.manage -----------------------------------------
drop policy if exists apparel_products_public_read on public.apparel_products;
create policy apparel_products_public_read on public.apparel_products
  for select using (true);

drop policy if exists apparel_products_staff_write on public.apparel_products;
create policy apparel_products_staff_write on public.apparel_products
  for all
  using (public.has_permission(auth.uid(), 'catalog.manage'))
  with check (public.has_permission(auth.uid(), 'catalog.manage'));

-- design_collections -> collections.manage -----------------------------------
drop policy if exists design_collections_public_read on public.design_collections;
create policy design_collections_public_read on public.design_collections
  for select using (true);

drop policy if exists design_collections_staff_write on public.design_collections;
create policy design_collections_staff_write on public.design_collections
  for all
  using (public.has_permission(auth.uid(), 'collections.manage'))
  with check (public.has_permission(auth.uid(), 'collections.manage'));

-- print_options -> pricing.manage -------------------------------------------
drop policy if exists print_options_public_read on public.print_options;
create policy print_options_public_read on public.print_options
  for select using (true);

drop policy if exists print_options_staff_write on public.print_options;
create policy print_options_staff_write on public.print_options
  for all
  using (public.has_permission(auth.uid(), 'pricing.manage'))
  with check (public.has_permission(auth.uid(), 'pricing.manage'));

-- logo_options -> pricing.manage --------------------------------------------
drop policy if exists logo_options_public_read on public.logo_options;
create policy logo_options_public_read on public.logo_options
  for select using (true);

drop policy if exists logo_options_staff_write on public.logo_options;
create policy logo_options_staff_write on public.logo_options
  for all
  using (public.has_permission(auth.uid(), 'pricing.manage'))
  with check (public.has_permission(auth.uid(), 'pricing.manage'));

-- ---------------------------------------------------------------------------
-- 2) profiles: optional backup phone number
--    رقم هاتف احتياطي اختياري في الملف الشخصي
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists secondary_phone text not null default '';

-- ---------------------------------------------------------------------------
-- 3) submit_customer_order: the single, authoritative checkout entry point
--    نقطة إنشاء الطلب الوحيدة: تتحقق من العميل، وتحسب السعر على السيرفر،
--    وتمنع التلاعب بالأسعار من المتصفح.
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
  v_group_id     uuid := coalesce(p_cart_group_id, gen_random_uuid());
  v_base_price   numeric := 0;
  v_print_price  numeric := 0;
  v_logo_price   numeric := 0;
  v_quantity     integer := 1;
  v_unit_price   numeric := 0;
  v_total_price  numeric := 0;
  v_product_info text;
  v_details      jsonb;
begin
  -- Guard 1: a signed-in customer is required / يجب تسجيل الدخول
  if auth.uid() is null then
    raise exception 'Authentication is required to place an order.'
      using errcode = '28000';
  end if;

  -- Guard 2: frozen / banned accounts cannot create orders / الحساب المجمّد أو المحظور ممنوع من الطلب
  if not public.is_account_active(auth.uid()) then
    raise exception 'This account is not allowed to place new orders.'
      using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'The cart is empty.' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(coalesce(nullif(v_item->>'quantity', '')::integer, 1), 1);

    -- Live base price from the catalog — never trusted from the browser / السعر من الكتالوج لا من المتصفح
    select p.base_price into v_base_price
      from public.apparel_products p
     where p.id::text = v_item->>'product_id';

    if not found then
      raise exception 'Unknown product in the cart: %', coalesce(v_item->>'product_id', '?')
        using errcode = '22023';
    end if;

    -- Reset before each lookup: a missing option means no surcharge
    -- تصفير قبل كل بحث: الخيار غير الموجود يعني بدون تكلفة إضافية
    v_print_price := 0;
    select coalesce(o.additional_price, 0) into v_print_price
      from public.print_options o
     where o.id::text = coalesce(v_item->>'print_option_id', '');

    v_logo_price := 0;
    select coalesce(o.additional_price, 0) into v_logo_price
      from public.logo_options o
     where o.option_type = coalesce(v_item->>'logo_option_id', '');

    v_unit_price  := coalesce(v_base_price, 0) + coalesce(v_print_price, 0) + coalesce(v_logo_price, 0);
    v_total_price := v_unit_price * v_quantity;

    v_product_info := concat_ws(' · ',
      nullif(v_item->>'category', ''),
      nullif(v_item->>'fit_type', ''),
      nullif(v_item->>'size', ''),
      nullif(v_item->>'color', ''),
      'Qty ' || v_quantity
    );

    -- Server-computed price + quantity win over whatever the client sent
    -- السعر والكمية المحسوبان على السيرفر يتجاوزان ما أرسله المتصفح
    v_details := coalesce(v_item->'order_details', '{}'::jsonb)
      || jsonb_build_object(
           'unit_price', v_unit_price,
           'garment_quantity', v_quantity,
           'secondary_phone', nullif(p_secondary_phone, '')
         );

    insert into public.orders (
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      product_info,
      design_name,
      print_option,
      logo_option,
      total_price,
      status,
      cart_group_id,
      created_at,
      order_details
    ) values (
      auth.uid(),
      coalesce(p_customer_name, ''),
      coalesce(p_customer_email, ''),
      coalesce(p_customer_phone, ''),
      coalesce(p_customer_address, ''),
      v_product_info,
      coalesce(v_item->>'design_name', ''),
      coalesce(v_item->>'print_option', ''),
      coalesce(v_item->>'logo_option', ''),
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
