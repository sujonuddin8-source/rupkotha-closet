import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PRODUCTS } from "./products";
import { DELIVERY_FEE, type CartItem, type Order, type OrderStatus, type Product } from "./types";

const CART_KEY = "rupkotha_cart_v1";
const ORDER_KEY = "rupkotha_orders_v1";
const PRODUCT_KEY = "rupkotha_products_v1";

interface StoreValue {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  hydrated: boolean;
  addToCart: (item: CartItem) => void;
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  placeOrder: (input: {
    customerName: string;
    phone: string;
    address: string;
    area: "inside" | "outside";
    note?: string;
  }) => Order;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  upsertProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProducts(read<Product[]>(PRODUCT_KEY, PRODUCTS));
    setCart(read<CartItem[]>(CART_KEY, []));
    setOrders(read<Order[]>(ORDER_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  }, [orders, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(PRODUCT_KEY, JSON.stringify(products));
  }, [products, hydrated]);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === item.productId && i.size === item.size && i.color === item.color,
      );
      if (idx === -1) return [...prev, item];
      return prev.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + item.quantity } : i));
    });
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setCart((prev) =>
      prev.map((i, n) => (n === index ? { ...i, quantity: Math.max(1, quantity) } : i)),
    );
  }, []);

  const removeItem = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, n) => n !== index));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart],
  );
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  const placeOrder: StoreValue["placeOrder"] = useCallback(
    (input) => {
      const deliveryFee = DELIVERY_FEE[input.area];
      const order: Order = {
        id: `RF-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        ...input,
        items: cart,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        status: "pending",
        paymentMethod: "cod",
      };
      setOrders((prev) => [order, ...prev]);
      setCart([]);
      return order;
    },
    [cart, subtotal],
  );

  const setOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const upsertProduct = useCallback((product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev];
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value: StoreValue = {
    products,
    cart,
    orders,
    hydrated,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    cartCount,
    subtotal,
    placeOrder,
    setOrderStatus,
    upsertProduct,
    deleteProduct,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
