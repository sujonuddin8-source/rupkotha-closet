import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { AREA_LABEL, bdt, DELIVERY_FEE, toBn } from "@/lib/types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "চেকআউট — রূপকথা ফ্যাশন" },
      { name: "description", content: "নাম, ফোন ও ঠিকানা দিয়ে ক্যাশ অন ডেলিভারিতে অর্ডার করুন।" },
      { property: "og:title", content: "চেকআউট — রূপকথা ফ্যাশন" },
      { property: "og:description", content: "ক্যাশ অন ডেলিভারিতে সহজে অর্ডার সম্পন্ন করুন।" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cart, subtotal, placeOrder, hydrated } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customerName: "", phone: "", address: "", note: "" });
  const [area, setArea] = useState<"inside" | "outside">("inside");
  const deliveryFee = DELIVERY_FEE[area];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !/^01\d{9}$/.test(form.phone) || !form.address.trim()) {
      toast.error("নাম, সঠিক ১১ ডিজিটের ফোন নম্বর ও ঠিকানা দিন");
      return;
    }
    const order = placeOrder({ ...form, area });
    navigate({ to: "/order/$id", params: { id: order.id } });
  };

  if (hydrated && cart.length === 0) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h1 className="text-xl font-bold">কার্ট খালি</h1>
          <p className="mt-2 text-muted-foreground">চেকআউট করতে অন্তত একটি পণ্য যোগ করুন।</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">পণ্য দেখুন</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">চেকআউট</h1>
        <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5 rounded-3xl border border-border/70 bg-card p-6">
            <div>
              <Label htmlFor="name">পূর্ণ নাম *</Label>
              <Input
                id="name"
                className="mt-1.5 rounded-xl"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="আপনার নাম"
              />
            </div>
            <div>
              <Label htmlFor="phone">মোবাইল নম্বর *</Label>
              <Input
                id="phone"
                inputMode="numeric"
                className="mt-1.5 rounded-xl"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <Label htmlFor="address">সম্পূর্ণ ঠিকানা *</Label>
              <Textarea
                id="address"
                className="mt-1.5 rounded-xl"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="বাসা, রোড, এলাকা, থানা, জেলা"
              />
            </div>
            <div>
              <p className="text-sm font-medium">ডেলিভারি এরিয়া *</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {(["inside", "outside"] as const).map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setArea(a)}
                    className={`rounded-2xl border p-4 text-left text-sm transition-colors ${
                      area === a ? "border-primary bg-accent" : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <span className="block font-semibold">{AREA_LABEL[a]}</span>
                    <span className="text-muted-foreground">
                      ডেলিভারি চার্জ {bdt(DELIVERY_FEE[a])}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="note">অতিরিক্ত নোট</Label>
              <Textarea
                id="note"
                className="mt-1.5 rounded-xl"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="ঐচ্ছিক"
              />
            </div>
            <div className="rounded-2xl border border-primary bg-accent p-4 text-sm">
              <span className="font-semibold">পেমেন্ট: ক্যাশ অন ডেলিভারি</span>
              <p className="text-muted-foreground">পণ্য হাতে পেয়ে ডেলিভারিম্যানকে টাকা দিন।</p>
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-border/70 bg-card p-6">
            <h2 className="text-lg font-bold">অর্ডার সামারি</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {cart.map((i) => (
                <li key={`${i.productId}-${i.size}-${i.color}`} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {i.name} ({i.size}) × {toBn(i.quantity)}
                  </span>
                  <span className="font-medium">{bdt(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">সাবটোটাল</span>
                <span>{bdt(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ডেলিভারি</span>
                <span>{bdt(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>সর্বমোট</span>
                <span className="text-primary">{bdt(subtotal + deliveryFee)}</span>
              </div>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full rounded-full">
              অর্ডার কনফার্ম করুন
            </Button>
          </aside>
        </form>
      </div>
    </StoreLayout>
  );
}
