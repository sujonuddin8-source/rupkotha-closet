import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "./images";
import type { CartItem, CategorySlug, Order, OrderStatus, Product } from "./types";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  image: string;
  description: string;
  sizes: string[];
  colors: string[];
  stock: number;
  rating: number;
  featured: boolean;
};

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category as CategorySlug,
    price: row.price,
    ...(row.old_price != null ? { oldPrice: row.old_price } : {}),
    imageKey: row.image,
    image: resolveImage(row.image),
    description: row.description,
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    stock: row.stock,
    rating: Number(row.rating),
    featured: row.featured,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapProduct(r as ProductRow));
}

export async function saveProduct(product: Product): Promise<void> {
  const { error } = await supabase.from("products").upsert({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    old_price: product.oldPrice ?? null,
    image: product.imageKey || "baby-set",
    description: product.description,
    sizes: product.sizes,
    colors: product.colors,
    stock: product.stock,
    rating: product.rating,
    featured: product.featured ?? false,
  });
  if (error) throw new Error(error.message);
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
  area: string;
  note: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  payment_method: string;
  order_items?: {
    product_id: string | null;
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
    area: row.area as "inside" | "outside",
    ...(row.note ? { note: row.note } : {}),
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    status: row.status,
    paymentMethod: "cod",
    items: (row.order_items ?? []).map((i) => ({
      productId: i.product_id ?? "",
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

export async function createOrder(input: {
  customerName: string;
  phone: string;
  address: string;
  area: "inside" | "outside";
  note?: string;
  items: CartItem[];
}): Promise<string> {
  const { data, error } = await supabase.rpc("place_order", {
    _customer_name: input.customerName,
    _phone: input.phone,
    _address: input.address,
    _area: input.area,
    _note: input.note ?? "",
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

/** Customer order tracking by order code — returns non-sensitive fields only. */
export async function fetchOrderByCode(orderCode: string): Promise<Order | null> {
  const { data, error } = await supabase.rpc("get_order_public", { _order_code: orderCode });
  if (error) throw new Error(error.message);
  if (!data) return null;
  const o = data as unknown as {
    id: string;
    createdAt: string;
    customerName: string;
    phone: string;
    address: string;
    area: "inside" | "outside";
    note: string | null;
    subtotal: number;
    deliveryFee: number;
    total: number;
    status: OrderStatus;
    paymentMethod: string;
    items: {
      productId: string | null;
      name: string;
      image: string;
      price: number;
      size: string;
      color: string;
      quantity: number;
    }[];
  };
  return {
    id: o.id,
    createdAt: o.createdAt,
    customerName: o.customerName,
    phone: o.phone,
    address: o.address,
    area: o.area,
    ...(o.note ? { note: o.note } : {}),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    status: o.status,
    paymentMethod: "cod",
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
