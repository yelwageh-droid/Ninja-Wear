alter table public.orders
  add column if not exists customer_address text,
  add column if not exists cart_group_id uuid,
  add column if not exists order_details jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create index if not exists orders_cart_group_id_idx
  on public.orders (cart_group_id);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);
