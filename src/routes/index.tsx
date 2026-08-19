import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Truck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { StoreLayout } from "@/components/StoreLayout";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/types";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "রূপকথা ফ্যাশন — শিশুদের পোশাকের অনলাইন স্টোর" },
      {
        name: "description",
        content:
          "ছেলে, মেয়ে, বেবি ও নিউ বর্ন শিশুদের আরামদায়ক পোশাক। ক্যাশ অন ডেলিভারিতে সারা বাংলাদেশে ডেলিভারি।",
      },
      { property: "og:title", content: "রূপকথা ফ্যাশন — শিশুদের পোশাকের অনলাইন স্টোর" },
      {
        property: "og:description",
        content: "শিশুদের জন্য নরম, আরামদায়ক ও সুন্দর পোশাকের কালেকশন।",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { products, productsLoading, productsError } = useStore();
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const latest = products.slice(0, 8);

  return (
    <StoreLayout>
      <section className="gradient-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary">
              নতুন কালেকশন ২০২৬
            </span>
            <h1 className="text-3xl font-bold leading-snug sm:text-4xl md:text-5xl">
              ছোট্ট সোনামণিদের জন্য <span className="text-primary">রূপকথার</span> পোশাক
            </h1>
            <p className="max-w-md text-muted-foreground">
              নরম কটন, প্রাণবন্ত রঙ আর আরামদায়ক ফিট — প্রতিটি পোশাক তৈরি শিশুদের কথা ভেবে।
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/category/$slug" params={{ slug: "girls" }}>
                  কেনাকাটা শুরু করুন <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-card">
                <Link to="/search" search={{ q: "" }}>
                  সব পণ্য দেখুন
                </Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-card-soft">
            <img
              src={hero}
              alt="রূপকথা ফ্যাশনের শিশুদের পোশাক পরা শিশুরা"
              width={1600}
              height={912}
              className="size-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-bold">ক্যাটাগরি</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="rounded-3xl border border-border/70 bg-card p-6 text-center transition-all hover:-translate-y-1 hover:shadow-card-soft"
            >
              <div className="text-3xl">{c.emoji}</div>
              <div className="mt-2 font-semibold">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-bold">ফিচার্ড পণ্য</h2>
          <Link to="/search" search={{ q: "" }} className="text-sm text-primary hover:underline">
            সব দেখুন
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-bold">নতুন এসেছে</h2>
        {productsLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">পণ্য লোড হচ্ছে...</p>
        )}
        {productsError && (
          <p className="py-8 text-center text-sm text-destructive">{productsError}</p>
        )}
        {!productsLoading && !productsError && latest.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">এখনো কোনো পণ্য নেই।</p>
        )}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-8 sm:grid-cols-3">
        {[
          { icon: Truck, title: "দ্রুত ডেলিভারি", text: "ঢাকায় ২৪ ঘণ্টা, সারা দেশে ৩ দিনে" },
          { icon: BadgeCheck, title: "ক্যাশ অন ডেলিভারি", text: "পণ্য হাতে পেয়ে টাকা পরিশোধ" },
          { icon: Undo2, title: "সহজ রিটার্ন", text: "৭ দিনের মধ্যে রিটার্ন সুবিধা" },
        ].map((f) => (
          <div key={f.title} className="rounded-3xl border border-border/70 bg-card p-6">
            <f.icon className="size-6 text-primary" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </StoreLayout>
  );
}
