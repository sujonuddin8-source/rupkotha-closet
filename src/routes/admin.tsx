import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BrandMark } from "@/components/SiteHeader";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "ড্যাশবোর্ড", exact: true },
  { to: "/admin/products", label: "পণ্য ম্যানেজমেন্ট", exact: false },
  { to: "/admin/orders", label: "অর্ডার সমূহ", exact: false },
] as const;

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <BrandMark compact />
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            অ্যাডমিন
          </span>
          <nav className="ml-auto flex flex-wrap gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
                activeProps={{ className: "bg-primary text-primary-foreground" }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/"
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
            >
              স্টোর দেখুন
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
