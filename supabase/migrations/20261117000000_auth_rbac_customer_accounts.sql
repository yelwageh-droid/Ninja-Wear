-- ============================================================================
-- Ninja Wear — Auth / RBAC / Customer accounts
-- نظام الأدوار والصلاحيات وحسابات العملاء
--
-- Role model / نموذج الأدوار:
--   super_admin -> every permission (implicit)              صلاحيات كاملة
--   admin       -> starts with orders.view only, more can be granted by super_admin
--   user        -> storefront customer, no staff permissions
--
-- Account status / حالة الحساب (public.profiles.account_status):
--   active -> normal                                          طبيعي
--   frozen -> can sign in but cannot place new orders         يدخل لكن ممنوع الطلبات
--   banned -> cannot sign in at all                           ممنوع الدخول
--
-- IMPORTANT / مهم: this migration is written to be additive and safe to run on
-- the existing project. Review any pre-existing policies you created by hand.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) user_roles: simplified roles + granular permission array
--    (legacy designer/order_manager are folded into "admin")
-- ---------------------------------------------------------------------------
alter table public.user_roles
  add column if not exists permissions text[] not null default '{}';

update public.user_roles
   set role = 'admin'
 where role in ('designer', 'order_manager');

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles
  add constraint user_roles_role_check
  check (role in ('super_admin', 'admin', 'user'));

alter table public.user_roles
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 2) profiles: one row per auth user (customers + staff)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null default '',
  email          text not null default '',
  phone          text not null default '',
  address        text not null default '',
  account_status text not null default 'active'
                 check (account_status in ('active', 'frozen', 'banned')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists profiles_account_status_idx on public.profiles (account_status);

-- ---------------------------------------------------------------------------
-- 3) orders: link each order to the authenticated customer
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists customer_id uuid references auth.users(id) on delete set null;

create index if not exists orders_customer_id_idx on public.orders (customer_id);

-- ---------------------------------------------------------------------------
-- 4) helper functions (SECURITY DEFINER -> bypass RLS, avoid recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_staff(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles r
     where r.user_id = uid and r.role in ('super_admin', 'admin')
  );
$$;

create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles r
     where r.user_id = uid and r.role = 'super_admin'
  );
$$;

-- super_admin implicitly holds every permission               السوبر أدمن يملك كل الصلاحيات تلقائياً
create or replace function public.has_permission(uid uuid, perm text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles r
     where r.user_id = uid
       and (r.role = 'super_admin' or perm = any(r.permissions))
  );
$$;

create or replace function public.is_account_active(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select p.account_status = 'active' from public.profiles p where p.id = uid),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- 5) auto-provision profile + default 'user' role on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role, permissions)
  values (new.id, 'user', '{}')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 6) RLS: user_roles
-- ---------------------------------------------------------------------------
alter table public.user_roles enable row level security;

drop policy if exists user_roles_select_self_or_staff on public.user_roles;
create policy user_roles_select_self_or_staff on public.user_roles
  for select using (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists user_roles_super_admin_write on public.user_roles;
create policy user_roles_super_admin_write on public.user_roles
  for all
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 7) RLS: profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_self_or_staff on public.profiles;
create policy profiles_select_self_or_staff on public.profiles
  for select using (id = auth.uid() or public.has_permission(auth.uid(), 'customers.view'));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_staff_update on public.profiles;
create policy profiles_staff_update on public.profiles
  for update
  using (public.has_permission(auth.uid(), 'customers.manage'))
  with check (public.has_permission(auth.uid(), 'customers.manage'));

-- Self-service updates must never touch the protective columns.
-- منع العميل من تغيير حالة حسابه بنفسه
create or replace function public.prevent_profile_escalation()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.account_status is distinct from old.account_status
     and not public.has_permission(auth.uid(), 'customers.manage') then
    raise exception 'Only staff with the customers.manage permission can change account status.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_prevent_escalation on public.profiles;
create trigger profiles_prevent_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_escalation();

-- ---------------------------------------------------------------------------
-- 8) RLS: orders
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists orders_select_own_or_staff on public.orders;
create policy orders_select_own_or_staff on public.orders
  for select using (
    customer_id = auth.uid()
    or public.has_permission(auth.uid(), 'orders.view')
  );

-- Customers may only create orders for themselves and while their account is active
-- العميل ينشئ طلباته فقط وحسابه نشط
drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert with check (
    customer_id = auth.uid()
    and public.is_account_active(auth.uid())
  );

drop policy if exists orders_update_staff on public.orders;
create policy orders_update_staff on public.orders
  for update
  using (public.has_permission(auth.uid(), 'orders.edit'))
  with check (public.has_permission(auth.uid(), 'orders.edit'));

-- ---------------------------------------------------------------------------
-- 9) storage: custom_design_uploads (private bucket, signed URLs)
--    Ordering now always requires an active signed-in customer, so anonymous
--    uploads are no longer allowed: that closes the open storage-write hole.
--    الطلب يحتاج حساب نشط، لذلك لا نسمح بالرفع المجهول ونسدّ ثغرة الكتابة
-- ---------------------------------------------------------------------------
drop policy if exists custom_uploads_insert on storage.objects;
create policy custom_uploads_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'custom_design_uploads'
    and public.is_account_active(auth.uid())
  );

drop policy if exists custom_uploads_staff_select on storage.objects;
create policy custom_uploads_staff_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'custom_design_uploads'
    and public.has_permission(auth.uid(), 'orders.view')
  );

-- ---------------------------------------------------------------------------
-- 10) drop the legacy update_order_status RPC
--     It predates RBAC and may be SECURITY DEFINER, which would let any
--     authenticated user change order statuses and bypass the RLS policies
--     above. Status changes now go through a plain, RLS-protected UPDATE.
--     إزالة الدالة القديمة لأنها قد تتجاوز سياسات RLS؛ التعديل الآن عبر UPDATE محمي
-- ---------------------------------------------------------------------------
do $$
declare
  function_signature text;
begin
  for function_signature in
    select p.oid::regprocedure::text
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'update_order_status'
  loop
    execute 'drop function if exists ' || function_signature || ' cascade';
  end loop;
end $$;
