-- ROLES
create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "roles read own or admin" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- PRODUCTS
create table public.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('boys','girls','baby','newborn')),
  price integer not null check (price >= 0),
  old_price integer,
  image text not null default 'baby-set',
  description text not null default '',
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock integer not null default 0,
  rating numeric(2,1) not null default 5,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select to anon, authenticated using (true);
create policy "products admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();

-- ORDERS
create type public.order_status as enum ('pending','confirmed','shipped','delivered');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_name text not null,
  phone text not null,
  address text not null,
  area text not null check (area in ('inside','outside')),
  note text,
  subtotal integer not null,
  delivery_fee integer not null,
  total integer not null,
  status public.order_status not null default 'pending',
  payment_method text not null default 'cod',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders admin read" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "orders admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text,
  name text not null,
  image text not null default 'baby-set',
  price integer not null,
  size text not null,
  color text not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items admin read" on public.order_items for select to authenticated using (public.has_role(auth.uid(),'admin'));
create index order_items_order_id_idx on public.order_items(order_id);

-- Guest checkout: atomic order creation, no table-level insert grants needed
create or replace function public.place_order(
  _customer_name text, _phone text, _address text, _area text, _note text, _items jsonb
) returns text language plpgsql security definer set search_path = public as $$
declare
  _code text;
  _order_id uuid;
  _subtotal integer := 0;
  _fee integer;
  it jsonb;
  p public.products%rowtype;
  qty integer;
begin
  if coalesce(trim(_customer_name),'') = '' or _phone !~ '^01[0-9]{9}$' or coalesce(trim(_address),'') = '' then
    raise exception 'invalid customer details';
  end if;
  if _area not in ('inside','outside') then raise exception 'invalid area'; end if;
  if jsonb_array_length(_items) = 0 or jsonb_array_length(_items) > 50 then raise exception 'invalid items'; end if;
  _fee := case when _area = 'inside' then 60 else 120 end;
  _code := 'RF-' || lpad((floor(random()*1000000))::int::text, 6, '0');
  insert into public.orders (order_code, customer_name, phone, address, area, note, subtotal, delivery_fee, total)
  values (_code, trim(_customer_name), _phone, trim(_address), _area, nullif(trim(coalesce(_note,'')),''), 0, _fee, 0)
  returning id into _order_id;

  for it in select * from jsonb_array_elements(_items) loop
    select * into p from public.products where id = it->>'productId';
    if not found then raise exception 'unknown product'; end if;
    qty := greatest(1, least(99, coalesce((it->>'quantity')::int, 1)));
    insert into public.order_items (order_id, product_id, name, image, price, size, color, quantity)
    values (_order_id, p.id, p.name, p.image, p.price, coalesce(it->>'size',''), coalesce(it->>'color',''), qty);
    _subtotal := _subtotal + p.price * qty;
  end loop;

  update public.orders set subtotal = _subtotal, total = _subtotal + _fee where id = _order_id;
  return _code;
end; $$;
grant execute on function public.place_order(text,text,text,text,text,jsonb) to anon, authenticated;

-- Customer tracking by exact order code (no sensitive/admin fields)
create or replace function public.get_order_public(_order_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare o public.orders%rowtype; result jsonb;
begin
  select * into o from public.orders where order_code = _order_code;
  if not found then return null; end if;
  select jsonb_build_object(
    'id', o.order_code,
    'createdAt', o.created_at,
    'customerName', o.customer_name,
    'phone', o.phone,
    'address', o.address,
    'area', o.area,
    'note', o.note,
    'subtotal', o.subtotal,
    'deliveryFee', o.delivery_fee,
    'total', o.total,
    'status', o.status,
    'paymentMethod', o.payment_method,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'productId', i.product_id, 'name', i.name, 'image', i.image,
        'price', i.price, 'size', i.size, 'color', i.color, 'quantity', i.quantity))
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  ) into result;
  return result;
end; $$;
grant execute on function public.get_order_public(text) to anon, authenticated;

-- SEED existing V9 catalog
insert into public.products (id,name,category,price,old_price,image,description,sizes,colors,stock,rating,featured) values
('rf-101','ছেলেদের কটন ক্যাজুয়াল শার্ট','boys',690,950,'boy-shirt','১০০% কটন কাপড়ে তৈরি আরামদায়ক ক্যাজুয়াল শার্ট। গরমে বাচ্চার ত্বকের জন্য নরম ও শ্বাস-প্রশ্বাসযোগ্য।',ARRAY['১-২ বছর','৩-৪ বছর','৫-৬ বছর','৭-৮ বছর'],ARRAY['আকাশি','সাদা','নেভি'],24,4.7,true),
('rf-102','ছেলেদের সেমি-লং পাঞ্জাবি','boys',1150,1450,'boy-panjabi','উৎসবের জন্য এমব্রয়ডারি করা প্রিমিয়াম পাঞ্জাবি। ঈদ ও যেকোনো অনুষ্ঠানে বাচ্চার জন্য পারফেক্ট।',ARRAY['১-২ বছর','৩-৪ বছর','৫-৬ বছর','৭-৮ বছর'],ARRAY['অফ হোয়াইট','ক্রিম'],12,4.9,true),
('rf-103','কিডস ডেনিম ডাঙ্গারি','boys',990,null,'boy-dungaree','স্ট্রেচেবল ডেনিমের আরামদায়ক ডাঙ্গারি, দৈনন্দিন খেলাধুলার জন্য উপযুক্ত।',ARRAY['১-২ বছর','৩-৪ বছর','৫-৬ বছর','৭-৮ বছর'],ARRAY['ব্লু ডেনিম'],8,4.5,false),
('rf-201','মেয়েদের পার্টি ফ্রক','girls',1290,1690,'girl-frock','নরম টুলে তৈরি গোলাপি পার্টি ফ্রক। জন্মদিন কিংবা যেকোনো উৎসবে রাজকন্যার সাজ।',ARRAY['১-২ বছর','৩-৪ বছর','৫-৬ বছর','৭-৮ বছর'],ARRAY['পিংক','পিচ'],18,4.8,true),
('rf-202','মেয়েদের থ্রি-পিস সেট','girls',1490,1850,'girl-three-piece','এমব্রয়ডারি করা ল্যাভেন্ডার থ্রি-পিস সেট, সাথে ওড়না ও হেয়ারব্যান্ড ফ্রি।',ARRAY['১-২ বছর','৩-৪ বছর','৫-৬ বছর','৭-৮ বছর'],ARRAY['ল্যাভেন্ডার'],10,4.6,true),
('rf-301','বেবি সফট কটন টু-পিস সেট','baby',560,720,'baby-set','অতি নরম কটনের টু-পিস সেট, বেবির সংবেদনশীল ত্বকের জন্য নিরাপদ।',ARRAY['৬-৯ মাস','৯-১২ মাস','১-২ বছর'],ARRAY['ল্যাভেন্ডার','পিংক'],30,4.7,true),
('rf-401','নিউ বর্ন গিফট সেট','newborn',890,1100,'newborn-set','নবজাতকের জন্য সম্পূর্ণ গিফট সেট — বডিস্যুট, ক্যাপ ও মিটেন সহ।',ARRAY['০-৩ মাস','৩-৬ মাস'],ARRAY['সাদা','পিংক'],15,5.0,true),
('rf-402','নিউ বর্ন কটন নিমা সেট','newborn',450,null,'newborn-set','হালকা কটনের নিমা সেট, সারাদিন আরামে রাখবে আপনার নবজাতককে।',ARRAY['০-৩ মাস','৩-৬ মাস'],ARRAY['সাদা'],40,4.4,false);