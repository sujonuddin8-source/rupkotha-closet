-- ============ enum extension ============
alter type public.order_status add value if not exists 'processing';
alter type public.order_status add value if not exists 'out_for_delivery';
alter type public.order_status add value if not exists 'cancelled';

-- ============ products ============
alter table public.products
  add column if not exists images text[] not null default '{}',
  add column if not exists primary_image text,
  add column if not exists active boolean not null default true;

update public.products set images = array[image] where cardinality(images) = 0;
update public.products set primary_image = image where primary_image is null;

-- ============ product_variants ============
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  size text not null,
  color text not null,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color)
);

grant select on public.product_variants to anon, authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;

create policy "variants public read" on public.product_variants
  for select to anon, authenticated using (true);
create policy "variants admin write" on public.product_variants
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- backfill variants from existing sizes/colors
insert into public.product_variants (product_id, size, color, stock)
select p.id, s, c, greatest(p.stock, 0)
from public.products p
cross join lateral unnest(coalesce(nullif(p.sizes, '{}'), array['One Size'])) s
cross join lateral unnest(coalesce(nullif(p.colors, '{}'), array['Default'])) c
on conflict (product_id, size, color) do nothing;

-- ============ store settings ============
create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  delivery_inside integer not null default 60 check (delivery_inside >= 0),
  delivery_outside integer not null default 120 check (delivery_outside >= 0),
  free_delivery_threshold integer,
  updated_at timestamptz not null default now()
);

grant select on public.store_settings to anon, authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;

create policy "settings public read" on public.store_settings
  for select to anon, authenticated using (true);
create policy "settings admin write" on public.store_settings
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();

insert into public.store_settings (id) values (true) on conflict (id) do nothing;

-- ============ coupons ============
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null default 'percent' check (discount_type in ('percent','fixed')),
  value integer not null check (value > 0),
  min_order integer not null default 0 check (min_order >= 0),
  max_discount integer,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  per_customer_limit integer,
  used_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant all on public.coupons to service_role;
grant select, insert, update, delete on public.coupons to authenticated;
alter table public.coupons enable row level security;

create policy "coupons admin all" on public.coupons
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create trigger coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null,
  phone text not null,
  user_id uuid,
  amount integer not null,
  created_at timestamptz not null default now()
);

grant all on public.coupon_redemptions to service_role;
grant select on public.coupon_redemptions to authenticated;
alter table public.coupon_redemptions enable row level security;

create policy "redemptions admin read" on public.coupon_redemptions
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============ orders ============
alter table public.orders
  add column if not exists user_id uuid,
  add column if not exists district text,
  add column if not exists upazila text,
  add column if not exists village text,
  add column if not exists address_detail text,
  add column if not exists discount integer not null default 0,
  add column if not exists coupon_code text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists refund_status text,
  add column if not exists cancel_reason text,
  add column if not exists cancelled_by text,
  add column if not exists cancelled_at timestamptz;

do $$ begin
  alter table public.orders add constraint orders_payment_status_check
    check (payment_status in ('pending','paid','failed','refund_pending','refunded'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders add constraint orders_payment_method_check
    check (payment_method in ('cod','bkash','nagad','card'));
exception when duplicate_object then null; end $$;

create index if not exists orders_user_id_idx on public.orders(user_id);

create policy "orders owner read" on public.orders
  for select to authenticated using (user_id is not null and user_id = auth.uid());

-- ============ order_items ============
alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null;

create policy "order items owner read" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- ============ order status timeline ============
create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

grant select on public.order_status_events to authenticated;
grant all on public.order_status_events to service_role;
alter table public.order_status_events enable row level security;

create policy "status events admin read" on public.order_status_events
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "status events owner read" on public.order_status_events
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create index if not exists order_status_events_order_idx on public.order_status_events(order_id);

-- backfill timeline for existing orders
insert into public.order_status_events (order_id, status, created_at)
select o.id, o.status, o.created_at from public.orders o
where not exists (select 1 from public.order_status_events e where e.order_id = o.id);

-- keep timeline in sync on admin status updates
create or replace function public.log_order_status()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_events (order_id, status) values (new.id, new.status);
  end if;
  return new;
end; $$;

drop trigger if exists orders_status_log on public.orders;
create trigger orders_status_log after update on public.orders
  for each row execute function public.log_order_status();
