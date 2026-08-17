export type CategorySlug = "boys" | "girls" | "baby" | "newborn";

export interface Category {
  slug: CategorySlug;
  name: string;
  emoji: string;
}

export interface Product {
  id: string;
  name: string;
  category: CategorySlug;
  price: number;
  oldPrice?: number;
  image: string;
  description: string;
  sizes: string[];
  colors: string[];
  stock: number;
  rating: number;
  featured?: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered";

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  area: "inside" | "outside";
  note?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "cod";
}

export const CATEGORIES: Category[] = [
  { slug: "boys", name: "ছেলে", emoji: "👦" },
  { slug: "girls", name: "মেয়ে", emoji: "👧" },
  { slug: "baby", name: "বেবি", emoji: "🧸" },
  { slug: "newborn", name: "নিউ বর্ন", emoji: "🍼" },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "পেন্ডিং",
  confirmed: "কনফার্মড",
  shipped: "শিপড",
  delivered: "ডেলিভারড",
};

export const AREA_LABEL = {
  inside: "ঢাকার ভিতরে",
  outside: "ঢাকার বাইরে",
} as const;

export const DELIVERY_FEE = { inside: 60, outside: 120 } as const;

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBn(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function bdt(value: number): string {
  return `৳${toBn(value.toLocaleString("en-US"))}`;
}
