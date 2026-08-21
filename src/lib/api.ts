import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "./images";
import type {
  CartItem,
  CategorySlug,
  Coupon,
  Order,
  OrderEvent,
  OrderStatus,
  PaymentMethod,
  Product,
  StoreSettings,
  Variant,
} from "./types";

type VariantRow = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  image: string;
  images: string[] | null;
  primary_image: string | null;
  description: string;
  sizes: string[];
  colors: string[];
  stock: number;
  rating: number;
  featured: boolean;
  active: boolean;
  product_variants?: VariantRow[];
};

function mapVariant(row: VariantRow): Variant {
  return {
    id: row.id,
    productId: row.product_id,
    size: row.size,
    color: row.color,
    stock: row.stock,
  };
}

export function mapProduct(row: ProductRow): Product {
  const primary = row.primary_image || row.image || "baby-set";
  const keys = row.images && row.images.length > 0 ? row.images : [primary];
  const ordered = [primary, ...keys.filter((k) => k !== primary)];
  const variants = (row.product_variants ?? []).map(mapVariant);
  const variantStock = variants.reduce((s, v) => s + v.stock, 0);
  return {
    id: row.id,
    name: row.name,
    category: row.category as CategorySlug,
    price: row.price,
    ...(row.old_price != null ? { oldPrice: row.old_price } : {}),
    imageKey: primary,
    image: resolveImage(primary),
    imageKeys: ordered,
    images: ordered.map(resolveImage),
    description: row.description,
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    stock: variants.length > 0 ? variantStock : row.stock,
    rating: Number(row.rating),
    featured: row.featured,
    active: row.active ?? true,
    variants,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapProduct(r as unknown as ProductRow));
}

export async function saveProduct(product: Product): Promise<void> {
  const { error } = await supabase.from("products").upsert({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    old_price: product.oldPrice ?? null,
    image: product.imageKey || "baby-set",
    primary_image: product.imageKey || "baby-set",
    images: product.imageKeys.length > 0 ? product.imageKeys : [product.imageKey || "baby-set"],
    description: product.description,
    sizes: product.sizes,
    colors: product.colors,
    stock: product.stock,
    rating: product.rating,
    featured: product.featured ?? false,
    active: product.active,
  });
  if (error) throw new Error(error.message);
}

/** Replace a product's Size+Color matrix, keeping stock for combinations that survive. */
export async function saveVariants(
  productId: string,
  wanted: { size: string; color: string; stock: number }[],
): Promise<Variant[]> {
  const { data: existing, error: readErr } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId);
  if (readErr) throw new Error(readErr.message);

  const rows = (existing ?? []) as VariantRow[];
  const key = (s: string, c: string) => `${s}||${c}`;
  const keep = new Set(wanted.map((w) => key(w.size, w.color)));
  const stale = rows.filter((r) => !keep.has(key(r.size, r.color)));
  if (stale.length > 0) {
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .in(
        "id",
        stale.map((r) => r.id),
      );
    if (error) throw new Error(error.message);
  }

  for (const w of wanted) {
    const match = rows.find((r) => r.size === w.size && r.color === w.color);
    if (match) {
      if (match.stock !== w.stock) {
        const { error } = await supabase
          .from("product_variants")
          .update({ stock: w.stock })
          .eq("id", match.id);
        if (error) throw new Error(error.message);
      }
    } else {
      const { error } = await supabase
        .from("product_variants")
        .insert({ product_id: productId, size: w.size, color: w.color, stock: w.stock });
      if (error) throw new Error(error.message);
    }
  }

  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId);
  if (error) throw new Error(error.message);
  return ((data ?? []) as VariantRow[]).map(mapVariant);
}

export async function removeProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

type OrderRow = {
  id: string;
  order_code: string;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string;
  district: string | null;
  upazila: string | null;
  village: string | null;
  address_detail: string | null;
  area: string;
  note: string | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  coupon_code: string | null;
  total: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  refund_status: string | null;
  cancel_reason: string | null;
  order_items?: {
    product_id: string | null;
    variant_id?: string | null;
    name: string;
    image: string;
    price: number;
    size: string;
    color: string;
    quantity: number;
  }[];
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.order_code,
    createdAt: row.created_at,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    district: row.district,
    upazila: row.upazila,
    village: row.village,
    addressDetail: row.address_detail,
    area: row.area as "inside" | "outside",
    ...(row.note ? { note: row.note } : {}),
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    discount: row.discount ?? 0,
    couponCode: row.coupon_code,
    total: row.total,
    status: row.status,
    paymentMethod: (row.payment_method ?? "cod") as PaymentMethod,
    paymentStatus: row.payment_status ?? "pending",
    refundStatus: row.refund_status,
    cancelReason: row.cancel_reason,
    items: (row.order_items ?? []).map((i) => ({
      productId: i.product_id ?? "",
      ...(i.variant_id ? { variantId: i.variant_id } : {}),
      name: i.name,
      image: resolveImage(i.image),
      price: i.price,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
    })),
  };
}

/** Admin only — blocked by row level security for everyone else. */
export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapOrder(r as unknown as OrderRow));
}

export async function updateOrderStatus(orderCode: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("order_code", orderCode);
  if (error) throw new Error(error.message);
}

export async function updatePaymentStatus(orderCode: string, paymentStatus: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: paymentStatus })
    .eq("order_code", orderCode);
  if (error) throw new Error(error.message);
}

export interface PlaceOrderInput {
  customerName: string;
  phone: string;
  district: string;
  upazila: string;
  village: string;
  addressDetail: string;
  area: "inside" | "outside";
  note?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  items: CartItem[];
}

export async function createOrder(input: PlaceOrderInput): Promise<string> {
  const { data, error } = await supabase.rpc("place_order_v2", {
    _customer_name: input.customerName,
    _phone: input.phone,
    _district: input.district,
    _upazila: input.upazila,
    _village: input.village,
    _address_detail: input.addressDetail,
    _area: input.area,
    _note: input.note ?? "",
    _payment_method: input.paymentMethod,
    _coupon_code: input.couponCode ?? "",
    _items: input.items.map((i) => ({
      productId: i.productId,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
    })),
  });
  if (error) throw new Error(error.message);
  return String(data);
}

type TrackingJson = {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  district: string | null;
  upazila: string | null;
  village: string | null;
  addressDetail: string | null;
  area: "inside" | "outside";
  note: string | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode: string | null;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  refundStatus: string | null;
  cancelReason: string | null;
  items: {
    productId: string | null;
    name: string;
    image: string;
    price: number;
    size: string;
    color: string;
    quantity: number;
  }[];
  timeline: OrderEvent[];
};

/** Secure customer tracking — needs the matching phone number or the owning account. */
export async function fetchOrderTracking(
  orderCode: string,
  phone?: string,
): Promise<Order | null> {
  const { data, error } = await supabase.rpc("get_order_tracking", {
    _order_code: orderCode,
    _phone: phone && phone.trim() ? phone.trim() : "",
  });
  if (error) throw new Error(error.message);
  if (!data) return null;
  const o = data as unknown as TrackingJson;
  return {
    id: o.id,
    createdAt: o.createdAt,
    customerName: o.customerName,
    phone: o.phone,
    address: o.address,
    district: o.district,
    upazila: o.upazila,
    village: o.village,
    addressDetail: o.addressDetail,
    area: o.area,
    ...(o.note ? { note: o.note } : {}),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    discount: o.discount ?? 0,
    couponCode: o.couponCode,
    total: o.total,
    status: o.status,
    paymentMethod: (o.paymentMethod ?? "cod") as PaymentMethod,
    paymentStatus: o.paymentStatus ?? "pending",
    refundStatus: o.refundStatus,
    cancelReason: o.cancelReason,
    timeline: o.timeline ?? [],
    items: (o.items ?? []).map((i) => ({
      productId: i.productId ?? "",
      name: i.name,
      image: resolveImage(i.image),
      price: i.price,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
    })),
  };
}

export async function cancelOrder(
  orderCode: string,
  phone: string,
  reason: string,
): Promise<{ ok: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc("cancel_order", {
    _order_code: orderCode,
    _phone: phone,
    _reason: reason,
  });
  if (error) throw new Error(error.message);
  return (data ?? { ok: false }) as unknown as { ok: boolean; reason?: string };
}

export interface MyOrderSummary {
  id: string;
  createdAt: string;
  total: number;
  status: OrderStatus;
  paymentStatus: string;
  phone: string;
}

export async function fetchMyOrders(): Promise<MyOrderSummary[]> {
  const { data, error } = await supabase.rpc("get_my_orders");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as MyOrderSummary[];
}

export async function validateCoupon(
  code: string,
  subtotal: number,
  phone?: string,
): Promise<{ valid: boolean; discount?: number; code?: string; reason?: string }> {
  const { data, error } = await supabase.rpc("validate_coupon", {
    _code: code,
    _subtotal: subtotal,
    _phone: phone && phone.trim() ? phone.trim() : "",
  });
  if (error) throw new Error(error.message);
  return (data ?? { valid: false }) as unknown as {
    valid: boolean;
    discount?: number;
    code?: string;
    reason?: string;
  };
}

export async function fetchSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase.from("store_settings").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return {
    deliveryInside: data?.delivery_inside ?? 60,
    deliveryOutside: data?.delivery_outside ?? 120,
    freeDeliveryThreshold: data?.free_delivery_threshold ?? null,
  };
}

export async function saveSettings(s: StoreSettings): Promise<void> {
  const { error } = await supabase
    .from("store_settings")
    .update({
      delivery_inside: s.deliveryInside,
      delivery_outside: s.deliveryOutside,
      free_delivery_threshold: s.freeDeliveryThreshold,
    })
    .eq("id", true);
  if (error) throw new Error(error.message);
}

type CouponRow = {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  used_count: number;
  active: boolean;
};

function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type === "amount" ? "amount" : "percent",
    value: row.value,
    minOrder: row.min_order,
    maxDiscount: row.max_discount,
    usageLimit: row.usage_limit,
    perCustomerLimit: row.per_customer_limit,
    usedCount: row.used_count,
    active: row.active,
  };
}

/** Admin only. */
export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as CouponRow[]).map(mapCoupon);
}

export async function saveCoupon(c: Omit<Coupon, "id" | "usedCount"> & { id?: string }): Promise<void> {
  const payload = {
    code: c.code.toUpperCase().trim(),
    discount_type: c.discountType,
    value: c.value,
    min_order: c.minOrder,
    max_discount: c.maxDiscount,
    usage_limit: c.usageLimit,
    per_customer_limit: c.perCustomerLimit,
    active: c.active,
  };
  const { error } = c.id
    ? await supabase.from("coupons").update(payload).eq("id", c.id)
    : await supabase.from("coupons").insert(payload);
  if (error) throw new Error(error.message);
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
