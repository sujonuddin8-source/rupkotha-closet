import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { fetchOrderByCode } from "@/lib/api";
import type { Order } from "@/lib/types";
import { AREA_LABEL, bdt, STATUS_LABEL, toBn } from "@/lib/types";

export const Route = createFileRoute("/order/$id")({
  head: () => ({
    meta: [
      { title: "অর্ডার কনফার্মেশন — রূপকথা ফ্যাশন" },
      { name: "description", content: "আপনার অর্ডারের বিস্তারিত ও অর্ডার আইডি দেখুন।" },
      { property: "og:title", content: "অর্ডার কনফার্মেশন — রূপকথা ফ্যাশন" },
      { property: "og:description", content: "অর্ডার সফলভাবে গ্রহণ করা হয়েছে।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchOrderByCode(id)
      .then((o) => {
        if (!active) return;
        setOrder(o);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "অর্ডার লোড করা যায়নি");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">
          লোড হচ্ছে...
        </div>
      </StoreLayout>
    );
  }

  if (error) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-xl font-bold text-destructive">অর্ডার লোড করা যায়নি</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-6 rounded-full" onClick={() => window.location.reload()}>
            আবার চেষ্টা করুন
          </Button>
        </div>
      </StoreLayout>
    );
  }

  if (!order) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-xl font-bold">অর্ডার পাওয়া যায়নি</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">হোমে ফিরে যান</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-border/70 bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto size-14 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">অর্ডার সফল হয়েছে!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ধন্যবাদ {order.customerName}। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
          </p>
          <div className="mt-5 inline-block rounded-2xl gradient-soft px-6 py-3">
            <span className="text-xs text-muted-foreground">অর্ডার আইডি</span>
            <div className="text-xl font-bold tracking-wider text-primary">{order.id}</div>
          </div>
          <p className="mt-3 text-sm">
            স্ট্যাটাস:{" "}
            <span className="font-semibold text-primary">{STATUS_LABEL[order.status]}</span>
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-border/70 bg-card p-6">
          <h2 className="text-lg font-bold">অর্ডারের বিবরণ</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {order.items.map((i) => (
              <li key={`${i.productId}-${i.size}-${i.color}`} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.name} ({i.size}, {i.color}) × {toBn(i.quantity)}
                </span>
                <span className="font-medium">{bdt(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">সাবটোটাল</span>
              <span>{bdt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ডেলিভারি ({AREA_LABEL[order.area]})</span>
              <span>{bdt(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>সর্বমোট (ক্যাশ অন ডেলিভারি)</span>
              <span className="text-primary">{bdt(order.total)}</span>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">ডেলিভারি ঠিকানা</p>
            <p>
              {order.customerName} · {order.phone}
            </p>
            <p>{order.address}</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/">আরও কেনাকাটা করুন</Link>
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}
