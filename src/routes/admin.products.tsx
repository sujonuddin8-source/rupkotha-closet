import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { bdt, CATEGORIES, toBn, type CategorySlug, type Product } from "@/lib/types";
import placeholder from "@/assets/p-baby-set.jpg";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [
      { title: "পণ্য ম্যানেজমেন্ট — রূপকথা ফ্যাশন" },
      { name: "description", content: "পণ্য যোগ করুন, দাম ও স্টক-সাইজ আপডেট করুন।" },
      { property: "og:title", content: "পণ্য ম্যানেজমেন্ট — রূপকথা ফ্যাশন" },
      { property: "og:description", content: "স্টক ও সাইজ নিয়ন্ত্রণ করুন এক জায়গা থেকে।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProducts,
});

function AdminProducts() {
  const { products, upsertProduct, deleteProduct } = useStore();
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "boys" as CategorySlug,
    sizes: "১-২ বছর, ৩-৪ বছর",
  });

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !Number(form.price)) {
      toast.error("নাম ও দাম দিন");
      return;
    }
    const product: Product = {
      id: `rf-${Date.now().toString().slice(-5)}`,
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      image: placeholder,
      description: "নতুন যোগ করা পণ্য।",
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors: ["ডিফল্ট"],
      stock: Number(form.stock) || 0,
      rating: 5,
    };
    upsertProduct(product);
    setForm({ ...form, name: "", price: "", stock: "" });
    toast.success("পণ্য যোগ হয়েছে");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">পণ্য ম্যানেজমেন্ট</h1>

      <form onSubmit={addProduct} className="rounded-3xl border border-border/70 bg-card p-6">
        <h2 className="mb-4 text-lg font-bold">নতুন পণ্য</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label htmlFor="pname">নাম</Label>
            <Input
              id="pname"
              className="mt-1.5 rounded-xl"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pprice">দাম</Label>
            <Input
              id="pprice"
              inputMode="numeric"
              className="mt-1.5 rounded-xl"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pstock">স্টক</Label>
            <Input
              id="pstock"
              inputMode="numeric"
              className="mt-1.5 rounded-xl"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pcat">ক্যাটাগরি</Label>
            <select
              id="pcat"
              className="mt-1.5 h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as CategorySlug })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="psizes">সাইজ (কমা দিয়ে)</Label>
            <Input
              id="psizes"
              className="mt-1.5 rounded-xl"
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            />
          </div>
        </div>
        <Button type="submit" className="mt-4 rounded-full">
          <Plus className="mr-1 size-4" /> যোগ করুন
        </Button>
      </form>

      <section className="space-y-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-4 rounded-3xl border border-border/70 bg-card p-4"
          >
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              width={900}
              height={900}
              className="size-16 rounded-2xl object-cover"
            />
            <div className="min-w-40 flex-1">
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {CATEGORIES.find((c) => c.slug === p.category)?.name} · {bdt(p.price)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">সাইজ: {p.sizes.join(", ")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`stock-${p.id}`} className="text-xs">
                স্টক
              </Label>
              <Input
                id={`stock-${p.id}`}
                inputMode="numeric"
                className="h-9 w-20 rounded-xl"
                value={String(p.stock)}
                onChange={(e) => upsertProduct({ ...p, stock: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`sizes-${p.id}`} className="text-xs">
                সাইজ
              </Label>
              <Input
                id={`sizes-${p.id}`}
                className="h-9 w-56 rounded-xl"
                value={p.sizes.join(", ")}
                onChange={(e) =>
                  upsertProduct({
                    ...p,
                    sizes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </div>
            <span className="text-xs text-muted-foreground">রেটিং {toBn(p.rating)}</span>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive"
              aria-label="মুছুন"
              onClick={() => {
                deleteProduct(p.id);
                toast.success("পণ্য মুছে ফেলা হয়েছে");
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
