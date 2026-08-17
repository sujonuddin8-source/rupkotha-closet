import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { AREA_LABEL, bdt, STATUS_LABEL, toBn, type OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "অর্ডার ম্যানেজমেন্ট — রূপকথা ফ্যাশন" },
      { name: "description", content: "সব অর্ডার দেখুন ও স্ট্যাটাস আপডেট করুন।" },
      { property: "og:title", content: "অর্ডার ম্যানেজমেন্ট — রূপকথা ফ্যাশন" },
      { property: "og:description", content: "পেন্ডিং থেকে ডেলিভারড পর্যন্ত অর্ডার নিয়ন্ত্রণ।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrders,
});

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

function AdminOrders() {
  const { orders, setOrderStatus } = useStore();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const list = orders.filter((o) => filter === "all" || o.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">অর্ডার সমূহ</h1>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setFilter("all")}
        >
          সব ({toBn(orders.length)})
        </Button>
        {STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setFilter(s)}
          >
            {STATUS_LABEL[s]} ({toBn(orders.filter((o) => o.status === s).length)})
          </Button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-3xl border border-border/70 bg-card p-10 text-center text-sm text-muted-foreground">
          কোনো অর্ডার নেই।
        </p>
      ) : (
        <div className="space-y-4">
          {list.map((o) => (
            <div key={o.id} className="rounded-3xl border border-border/70 bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{o.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.customerName} · {o.phone} · {AREA_LABEL[o.area]}
                  </p>
                  <p className="text-xs text-muted-foreground">{o.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{bdt(o.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {toBn(o.items.reduce((s, i) => s + i.quantity, 0))} পিস · ক্যাশ অন ডেলিভারি
                  </p>
                </div>
              </div>

              <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
                {o.items.map((i) => (
                  <li key={`${i.productId}-${i.size}-${i.color}`}>
                    {i.name} ({i.size}, {i.color}) × {toBn(i.quantity)}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={o.status === s ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => {
                      setOrderStatus(o.id, s);
                      toast.success(`স্ট্যাটাস: ${STATUS_LABEL[s]}`);
                    }}
                  >
                    {STATUS_LABEL[s]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
