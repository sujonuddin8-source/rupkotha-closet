export type CategorySlug = "boys" | "girls" | "baby" | "newborn";

export interface Category {
  slug: CategorySlug;
  name: string;
  emoji: string;
}

export interface Variant {
  id: string;
  productId: string;
  size: string;
  color: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  category: CategorySlug;
  price: number;
  oldPrice?: number;
  /** Resolved primary image source. */
  image: string;
  /** Stored key of the primary image. */
  imageKey: string;
  /** Resolved gallery image sources (primary first). */
  images: string[];
  /** Stored gallery keys. */
  imageKeys: string[];
  description: string;
  sizes: string[];
  colors: string[];
  stock: number;
  rating: number;
  featured?: boolean;
  active: boolean;
  variants: Variant[];
}

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "bkash" | "nagad" | "card";

export interface OrderEvent {
  status: OrderStatus;
  note?: string | null;
  at: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  district?: string | null;
  upazila?: string | null;
  village?: string | null;
  addressDetail?: string | null;
  area: "inside" | "outside";
  note?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string | null;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  refundStatus?: string | null;
  cancelReason?: string | null;
  timeline?: OrderEvent[];
}

export interface StoreSettings {
  deliveryInside: number;
  deliveryOutside: number;
  freeDeliveryThreshold: number | null;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percent" | "amount";
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  active: boolean;
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
  processing: "প্রসেসিং",
  shipped: "শিপড",
  out_for_delivery: "ডেলিভারির পথে",
  delivered: "ডেলিভারড",
  cancelled: "বাতিল",
};

export const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: "ক্যাশ অন ডেলিভারি",
  bkash: "বিকাশ",
  nagad: "নগদ",
  card: "কার্ড / অনলাইন",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "পেমেন্ট বাকি",
  paid: "পরিশোধিত",
  failed: "ব্যর্থ",
  refund_pending: "রিফান্ড প্রক্রিয়াধীন",
  refunded: "রিফান্ড সম্পন্ন",
};

/** Orders can still be cancelled by the customer in these states. */
export const CANCELLABLE: OrderStatus[] = ["pending", "confirmed", "processing"];

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
