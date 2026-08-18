import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createOrder,
  fetchOrders,
  fetchProducts,
  removeProduct,
  saveProduct,
  updateOrderStatus,
} from "./api";
import { DELIVERY_FEE, type CartItem, type Order, type OrderStatus, type Product } from "./types";

const CART_KEY = "rupkotha_cart_v1";

interface StoreValue {
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  refreshProducts: () => Promise<void>;
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string | null;
  refreshOrders: () => Promise<void>;
  cart: CartItem[];
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
  }) => Promise<string>;
  setOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  upsertProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      setProducts(await fetchProducts());
      setProductsError(null);
    } catch (e) {
      setProductsError(e instanceof Error ? e.message : "পণ্য লোড করা যায়নি");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      setOrders(await fetchOrders());
      setOrdersError(null);
    } catch (e) {
      setOrdersError(e instanceof Error ? e.message : "অর্ডার লোড করা যায়নি");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    setCart(readCart());
    setHydrated(true);
    void refreshProducts();
  }, [refreshProducts]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

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

  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  const placeOrder: StoreValue["placeOrder"] = useCallback(
    async (input) => {
      const code = await createOrder({ ...input, items: cart });
      setCart([]);
      return code;
    },
    [cart],
  );

  const setOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const upsertProduct = useCallback(
    async (product: Product) => {
      await saveProduct(product);
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev];
      });
    },
    [],
  );

  const deleteProduct = useCallback(async (id: string) => {
    await removeProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value: StoreValue = {
    products,
    productsLoading,
    productsError,
    refreshProducts,
    orders,
    ordersLoading,
    ordersError,
    refreshOrders,
    cart,
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

export { DELIVERY_FEE };
