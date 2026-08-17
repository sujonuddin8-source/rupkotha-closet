import { Link, useNavigate } from "@tanstack/react-router";
import { Crown, Menu, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { CATEGORIES, toBn } from "@/lib/types";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="gradient-brand flex size-10 items-center justify-center rounded-2xl text-primary-foreground shadow-card-soft">
        <Crown className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold">রূপকথা ফ্যাশন</span>
        {!compact && (
          <span className="block text-[11px] text-muted-foreground">কিডস ফ্যাশন স্টোর</span>
        )}
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { cartCount } = useStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q: query } });
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="মেনু">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-6">
            <div className="mb-6">
              <BrandMark />
            </div>
            <nav className="flex flex-col gap-1">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm hover:bg-accent"
                >
                  {c.emoji} {c.name}
                </Link>
              ))}
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm hover:bg-accent"
              >
                ⚙️ অ্যাডমিন প্যানেল
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <BrandMark />

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <form onSubmit={submit} className="ml-auto hidden max-w-xs flex-1 items-center sm:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="পোশাক খুঁজুন..."
              className="rounded-full pl-9"
              aria-label="সার্চ"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-2">
          <Button asChild variant="ghost" size="icon" className="sm:hidden" aria-label="সার্চ">
            <Link to="/search" search={{ q: "" }}>
              <Search className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="কার্ট">
            <Link to="/cart">
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {toBn(cartCount)}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
