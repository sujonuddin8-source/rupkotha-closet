import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { CATEGORIES, toBn, type CategorySlug } from "@/lib/types";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "পণ্য খুঁজুন — রূপকথা ফ্যাশন" },
      { name: "description", content: "রূপকথা ফ্যাশনের সব শিশু পোশাক খুঁজুন ও ফিল্টার করুন।" },
      { property: "og:title", content: "পণ্য খুঁজুন — রূপকথা ফ্যাশন" },
      { property: "og:description", content: "নাম বা ক্যাটাগরি দিয়ে শিশুদের পোশাক খুঁজুন।" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { products } = useStore();
  const [term, setTerm] = useState(q);
  const [cat, setCat] = useState<CategorySlug | "all">("all");

  const results = products.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (q.trim() === "" || p.name.includes(q.trim()) || p.description.includes(q.trim())),
  );

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">পণ্য খুঁজুন</h1>
        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/search", search: { q: term } });
          }}
        >
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="যেমন: ফ্রক, পাঞ্জাবি, বেবি সেট"
              className="rounded-full pl-9"
              aria-label="সার্চ"
            />
          </div>
          <Button type="submit" className="rounded-full">
            খুঁজুন
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={cat === "all" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setCat("all")}
          >
            সব
          </Button>
          {CATEGORIES.map((c) => (
            <Button
              key={c.slug}
              size="sm"
              variant={cat === c.slug ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setCat(c.slug)}
            >
              {c.name}
            </Button>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">{toBn(results.length)} টি পণ্য</p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {results.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">কোনো পণ্য পাওয়া যায়নি।</p>
        )}
      </div>
    </StoreLayout>
  );
}
