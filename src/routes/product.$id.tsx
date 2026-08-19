import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/ProductCard";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { bdt, CATEGORIES, toBn, type CartItem } from "@/lib/types";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "পণ্যের বিবরণ — রূপকথা ফ্যাশন" },
      {
        name: "description",
        content: "সাইজ, রঙ ও দাম দেখে শিশুদের পোশাক অর্ডার করুন রূপকথা ফ্যাশন থেকে।",
      },
      { property: "og:title", content: "পণ্যের বিবরণ — রূপকথা ফ্যাশন" },
      { property: "og:description", content: "শিশুদের পোশাকের বিস্তারিত তথ্য ও দাম।" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { products, productsLoading, addToCart } = useStore();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  if (!product && productsLoading) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-6xl px-4 py-24 text-center text-muted-foreground">
          লোড হচ্ছে...
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h1 className="text-xl font-bold">পণ্যটি পাওয়া যায়নি</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">হোমে ফিরে যান</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const chosenSize = size ?? product.sizes[0] ?? "";
  const chosenColor = color ?? product.colors[0] ?? "";
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  const related = products.filter((p) => p.category === product.category && p.id !== product.id);
  const categoryName = CATEGORIES.find((c) => c.slug === product.category)?.name;

  const item = (): CartItem => ({
    productId: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    size: chosenSize,
    color: chosenColor,
    quantity: qty,
  });

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            হোম
          </Link>{" "}
          /{" "}
          <Link
            to="/category/$slug"
            params={{ slug: product.category }}
            className="hover:text-foreground"
          >
            {categoryName}
          </Link>{" "}
          / <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
            <img
              src={product.image}
              alt={product.name}
              width={900}
              height={900}
              className="aspect-square w-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="size-4 fill-primary text-primary" /> {toBn(product.rating)} · স্টক:{" "}
              {toBn(product.stock)} পিস
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{bdt(product.price)}</span>
              {product.oldPrice && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    {bdt(product.oldPrice)}
                  </span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                    {toBn(discount)}% ছাড়
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">সাইজ</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      chosenSize === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">রঙ</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      chosenColor === c
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">পরিমাণ</p>
              <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card p-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="কমান"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{toBn(qty)}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  aria-label="বাড়ান"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full"
                disabled={product.stock === 0}
                onClick={() => {
                  addToCart(item());
                  toast.success("কার্টে যোগ হয়েছে");
                }}
              >
                কার্টে যোগ করুন
              </Button>
              <Button
                size="lg"
                className="rounded-full"
                disabled={product.stock === 0}
                onClick={() => {
                  addToCart(item());
                  navigate({ to: "/checkout" });
                }}
              >
                এখনই কিনুন
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="size-4" /> ক্যাশ অন ডেলিভারি
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4" /> ৭ দিনের রিটার্ন
              </span>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-xl font-bold">সম্পর্কিত পণ্য</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </StoreLayout>
  );
}
