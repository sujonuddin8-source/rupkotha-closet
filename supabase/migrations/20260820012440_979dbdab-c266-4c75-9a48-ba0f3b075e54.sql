-- ============ bd locations ============
create table if not exists public.bd_locations (
  id uuid primary key default gen_random_uuid(),
  district text not null,
  upazila text not null,
  unique (district, upazila)
);
grant select on public.bd_locations to anon, authenticated;
grant all on public.bd_locations to service_role;
alter table public.bd_locations enable row level security;
create policy "locations public read" on public.bd_locations
  for select to anon, authenticated using (true);

-- ============ coupon validation ============
create or replace function public.validate_coupon(_code text, _subtotal integer, _phone text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c public.coupons%rowtype; disc integer; used integer;
begin
  select * into c from public.coupons where upper(code) = upper(trim(_code));
  if not found then return jsonb_build_object('valid', false, 'reason', 'কুপন কোডটি সঠিক নয়'); end if;
  if not c.active then return jsonb_build_object('valid', false, 'reason', 'কুপনটি বর্তমানে সক্রিয় নয়'); end if;
  if c.starts_at is not null and now() < c.starts_at then
    return jsonb_build_object('valid', false, 'reason', 'কুপনটি এখনো শুরু হয়নি'); end if;
  if c.ends_at is not null and now() > c.ends_at then
    return jsonb_build_object('valid', false, 'reason', 'কুপনের মেয়াদ শেষ'); end if;
  if _subtotal < c.min_order then
    return jsonb_build_object('valid', false, 'reason', 'ন্যূনতম অর্ডার ' || c.min_order || ' টাকা হতে হবে'); end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return jsonb_build_object('valid', false, 'reason', 'কুপনের ব্যবহারসীমা শেষ'); end if;
  if c.per_customer_limit is not null and _phone is not null then
    select count(*) into used from public.coupon_redemptions r where r.coupon_id = c.id and r.phone = _phone;
    if used >= c.per_customer_limit then
      return jsonb_build_object('valid', false, 'reason', 'আপনি এই কুপনটি সর্বোচ্চবার ব্যবহার করেছেন'); end if;
  end if;
  if c.discount_type = 'percent' then disc := floor(_subtotal * c.value / 100.0);
  else disc := c.value; end if;
  if c.max_discount is not null then disc := least(disc, c.max_discount); end if;
  disc := least(greatest(disc, 0), _subtotal);
  return jsonb_build_object('valid', true, 'code', upper(c.code), 'discount', disc);
end; $$;

revoke all on function public.validate_coupon(text, integer, text) from public;
grant execute on function public.validate_coupon(text, integer, text) to anon, authenticated;

-- ============ place order ============
create or replace function public.place_order_v2(
  _customer_name text, _phone text, _district text, _upazila text, _village text,
  _address_detail text, _area text, _note text, _payment_method text,
  _coupon_code text, _items jsonb
) returns text language plpgsql security definer set search_path = public as $$
declare
  _code text; _order_id uuid; _subtotal integer := 0; _fee integer; _discount integer := 0;
  _settings public.store_settings%rowtype; _coupon public.coupons%rowtype; _cv jsonb;
  it jsonb; p public.products%rowtype; v public.product_variants%rowtype; qty integer;
  _uid uuid := auth.uid();
begin
  if coalesce(trim(_customer_name),'') = '' or _phone !~ '^01[3-9][0-9]{8}$' then
    raise exception 'সঠিক নাম ও ১১ ডিজিটের মোবাইল নম্বর দিন';
  end if;
  if coalesce(trim(_village),'') = '' or coalesce(trim(_address_detail),'') = '' then
    raise exception 'গ্রাম/এলাকা ও বিস্তারিত ঠিকানা দিন';
  end if;
  if not exists (select 1 from public.bd_locations l where l.district = _district and l.upazila = _upazila) then
    raise exception 'জেলা ও উপজেলা সঠিক নয়';
  end if;
  if _area not in ('inside','outside') then raise exception 'ডেলিভারি এরিয়া সঠিক নয়'; end if;
  if _payment_method not in ('cod','bkash','nagad','card') then raise exception 'পেমেন্ট মেথড সঠিক নয়'; end if;
  if jsonb_array_length(_items) = 0 or jsonb_array_length(_items) > 50 then raise exception 'কার্ট খালি'; end if;

  select * into _settings from public.store_settings where id;
  _code := 'RF-' || lpad((floor(random()*1000000))::int::text, 6, '0');
  while exists (select 1 from public.orders o where o.order_code = _code) loop
    _code := 'RF-' || lpad((floor(random()*1000000))::int::text, 6, '0');
  end loop;

  insert into public.orders (
    order_code, user_id, customer_name, phone, address, area, note,
    district, upazila, village, address_detail,
    subtotal, delivery_fee, discount, total, payment_method, payment_status
  ) values (
    _code, _uid, trim(_customer_name), _phone,
    trim(_address_detail) || ', ' || trim(_village) || ', ' || _upazila || ', ' || _district,
    _area, nullif(trim(coalesce(_note,'')),''),
    _district, _upazila, trim(_village), trim(_address_detail),
    0, 0, 0, 0, _payment_method, 'pending'
  ) returning id into _order_id;

  for it in select * from jsonb_array_elements(_items) loop
    select * into p from public.products where id = it->>'productId' and active;
    if not found then raise exception 'পণ্যটি আর পাওয়া যাচ্ছে না'; end if;
    qty := greatest(1, least(99, coalesce((it->>'quantity')::int, 1)));
    select * into v from public.product_variants
      where product_id = p.id and size = coalesce(it->>'size','') and color = coalesce(it->>'color','')
      for update;
    if not found then raise exception '% — এই সাইজ/কালার পাওয়া যাচ্ছে না', p.name; end if;
    if v.stock < qty then raise exception '% (%/%) — স্টকে আছে মাত্র %', p.name, v.size, v.color, v.stock; end if;
    update public.product_variants set stock = stock - qty where id = v.id;
    insert into public.order_items (order_id, product_id, variant_id, name, image, price, size, color, quantity)
    values (_order_id, p.id, v.id, p.name, coalesce(p.primary_image, p.image), p.price, v.size, v.color, qty);
    _subtotal := _subtotal + p.price * qty;
  end loop;

  _fee := case when _area = 'inside' then _settings.delivery_inside else _settings.delivery_outside end;
  if _settings.free_delivery_threshold is not null and _subtotal >= _settings.free_delivery_threshold then
    _fee := 0;
  end if;

  if coalesce(trim(_coupon_code),'') <> '' then
    _cv := public.validate_coupon(_coupon_code, _subtotal, _phone);
    if (_cv->>'valid')::boolean then
      _discount := (_cv->>'discount')::int;
      select * into _coupon from public.coupons where upper(code) = upper(trim(_coupon_code));
      update public.coupons set used_count = used_count + 1 where id = _coupon.id;
      insert into public.coupon_redemptions (coupon_id, order_id, phone, user_id, amount)
      values (_coupon.id, _order_id, _phone, _uid, _discount);
      update public.orders set coupon_code = upper(trim(_coupon_code)) where id = _order_id;
    else
      raise exception '%', _cv->>'reason';
    end if;
  end if;

  update public.orders
    set subtotal = _subtotal, delivery_fee = _fee, discount = _discount,
        total = greatest(_subtotal + _fee - _discount, 0)
  where id = _order_id;

  insert into public.order_status_events (order_id, status, note)
  values (_order_id, 'pending', 'অর্ডার গ্রহণ করা হয়েছে');

  return _code;
end; $$;

revoke all on function public.place_order_v2(text,text,text,text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.place_order_v2(text,text,text,text,text,text,text,text,text,text,jsonb) to anon, authenticated;

-- ============ order tracking ============
create or replace function public.get_order_tracking(_order_code text, _phone text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare o public.orders%rowtype; result jsonb;
begin
  select * into o from public.orders where order_code = upper(trim(_order_code));
  if not found then return null; end if;
  if not (
    (o.user_id is not null and o.user_id = auth.uid())
    or (_phone is not null and o.phone = trim(_phone))
    or public.has_role(auth.uid(), 'admin')
  ) then
    return null;
  end if;
  select jsonb_build_object(
    'id', o.order_code, 'createdAt', o.created_at, 'customerName', o.customer_name,
    'phone', o.phone, 'address', o.address, 'district', o.district, 'upazila', o.upazila,
    'village', o.village, 'addressDetail', o.address_detail, 'area', o.area, 'note', o.note,
    'subtotal', o.subtotal, 'deliveryFee', o.delivery_fee, 'discount', o.discount,
    'couponCode', o.coupon_code, 'total', o.total, 'status', o.status,
    'paymentMethod', o.payment_method, 'paymentStatus', o.payment_status,
    'refundStatus', o.refund_status, 'cancelReason', o.cancel_reason,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'productId', i.product_id, 'name', i.name, 'image', i.image, 'price', i.price,
        'size', i.size, 'color', i.color, 'quantity', i.quantity))
      from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'timeline', coalesce((select jsonb_agg(jsonb_build_object(
        'status', e.status, 'note', e.note, 'at', e.created_at) order by e.created_at)
      from public.order_status_events e where e.order_id = o.id), '[]'::jsonb)
  ) into result;
  return result;
end; $$;

revoke all on function public.get_order_tracking(text, text) from public;
grant execute on function public.get_order_tracking(text, text) to anon, authenticated;

-- ============ my orders ============
create or replace function public.get_my_orders()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', o.order_code, 'createdAt', o.created_at, 'total', o.total,
      'status', o.status, 'paymentStatus', o.payment_status, 'phone', o.phone
    ) order by o.created_at desc)
    from public.orders o where o.user_id = auth.uid()
  ), '[]'::jsonb);
end; $$;

revoke all on function public.get_my_orders() from public;
grant execute on function public.get_my_orders() to authenticated;

-- ============ cancel order ============
create or replace function public.cancel_order(_order_code text, _phone text, _reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; i public.order_items%rowtype;
begin
  select * into o from public.orders where order_code = upper(trim(_order_code)) for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'অর্ডার পাওয়া যায়নি'); end if;
  if not ((o.user_id is not null and o.user_id = auth.uid()) or o.phone = trim(coalesce(_phone,''))) then
    return jsonb_build_object('ok', false, 'reason', 'অর্ডার যাচাই করা যায়নি');
  end if;
  if o.status not in ('pending','confirmed','processing') then
    return jsonb_build_object('ok', false, 'reason', 'শিপমেন্টের পরে অর্ডার বাতিল করা যায় না');
  end if;
  if coalesce(trim(_reason),'') = '' then
    return jsonb_build_object('ok', false, 'reason', 'বাতিলের কারণ দিন');
  end if;

  for i in select * from public.order_items where order_id = o.id loop
    if i.variant_id is not null then
      update public.product_variants set stock = stock + i.quantity where id = i.variant_id;
    end if;
  end loop;

  update public.orders set
    status = 'cancelled',
    cancel_reason = trim(_reason),
    cancelled_by = case when auth.uid() is not null then 'customer' else 'guest' end,
    cancelled_at = now(),
    refund_status = case when o.payment_status = 'paid' then 'refund_pending' else o.refund_status end,
    payment_status = case when o.payment_status = 'paid' then 'refund_pending' else o.payment_status end
  where id = o.id;

  insert into public.order_status_events (order_id, status, note)
  values (o.id, 'cancelled', trim(_reason));

  return jsonb_build_object('ok', true);
end; $$;

revoke all on function public.cancel_order(text, text, text) from public;
grant execute on function public.cancel_order(text, text, text) to anon, authenticated;
