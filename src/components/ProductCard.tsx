import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { bdt, toBn, type Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card transition-all hover:-translate-y-1 hover:shadow-card-soft"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={900}
          height={900}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
            -{toBn(discount)}%
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            স্টক শেষ
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold">{product.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-primary text-primary" />
          {toBn(product.rating)} · স্টক {toBn(product.stock)}
        </div>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-base font-bold text-primary">{bdt(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {bdt(product.oldPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
