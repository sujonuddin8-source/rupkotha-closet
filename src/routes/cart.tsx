import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { bdt, toBn } from "@/lib/types";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "আপনার কার্ট — রূপকথা ফ্যাশন" },
      { name: "description", content: "কার্টে থাকা শিশুদের পোশাক দেখুন ও অর্ডার সম্পন্ন করুন।" },
      { property: "og:title", content: "আপনার কার্ট — রূপকথা ফ্যাশন" },
      { property: "og:description", content: "কার্ট রিভিউ করে চেকআউটে যান।" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, updateQuantity, removeItem, subtotal, hydrated } = useStore();

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">আপনার কার্ট</h1>

        {hydrated && cart.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <ShoppingBag className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">আপনার কার্ট এখনো খালি।</p>
            <Button asChild className="rounded-full">
              <Link to="/">কেনাকাটা শুরু করুন</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {cart.map((item, i) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex gap-4 rounded-3xl border border-border/70 bg-card p-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    width={900}
                    height={900}
                    className="size-24 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold">{item.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      সাইজ: {item.size} · রঙ: {item.color}
                    </p>
                    <p className="mt-1 font-bold text-primary">{bdt(item.price)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-full"
                          onClick={() => updateQuantity(i, item.quantity - 1)}
                          aria-label="কমান"
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {toBn(item.quantity)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-full"
                          onClick={() => updateQuantity(i, item.quantity + 1)}
                          aria-label="বাড়ান"
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeItem(i)}
                      >
                        <Trash2 className="mr-1 size-4" /> সরান
                      </Button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold">
                    {bdt(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-3xl border border-border/70 bg-card p-6">
              <h2 className="text-lg font-bold">অর্ডার সামারি</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">সাবটোটাল</span>
                  <span className="font-semibold">{bdt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                  <span>চেকআউটে নির্ধারিত</span>
                </div>
              </div>
              <Button asChild size="lg" className="mt-6 w-full rounded-full">
                <Link to="/checkout">চেকআউট করুন</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
