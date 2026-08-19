import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { CATEGORIES, type CategorySlug } from "@/lib/types";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = CATEGORIES.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "ক্যাটাগরি পাওয়া যায়নি" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.category.name}দের পোশাক — রূপকথা ফ্যাশন`;
    const description = `${loaderData.category.name} শিশুদের জন্য আরামদায়ক পোশাকের কালেকশন, ক্যাশ অন ডেলিভারিতে অর্ডার করুন।`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
});

type SortKey = "new" | "low" | "high";

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { products, productsLoading, productsError } = useStore();
  const [sort, setSort] = useState<SortKey>("new");

  const list = products
    .filter((p) => p.category === (category.slug as CategorySlug))
    .sort((a, b) => (sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : 0));

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">
          {category.emoji} {category.name}দের পোশাক
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {productsLoading ? "পণ্য লোড হচ্ছে..." : `${list.length} টি পণ্য পাওয়া গেছে`}
        </p>
        {productsError && <p className="mt-2 text-sm text-destructive">{productsError}</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["new", "নতুন"],
              ["low", "কম দাম আগে"],
              ["high", "বেশি দাম আগে"],
            ] as [SortKey, string][]
          ).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={sort === key ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSort(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {list.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">এই ক্যাটাগরিতে এখনো পণ্য নেই।</p>
        )}
      </div>
    </StoreLayout>
  );
}
