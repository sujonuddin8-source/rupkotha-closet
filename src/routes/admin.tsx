import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { BrandMark } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "ড্যাশবোর্ড", exact: true },
  { to: "/admin/products", label: "পণ্য ম্যানেজমেন্ট", exact: false },
  { to: "/admin/orders", label: "অর্ডার সমূহ", exact: false },
] as const;

function AdminLayout() {
  const { session, isAdmin, loading, signOut, email } = useAuth();
  const { refreshOrders, refreshProducts } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) {
      void navigate({ to: "/admin-login", replace: true });
    }
  }, [loading, session, isAdmin, navigate]);

  useEffect(() => {
    if (!loading && session && isAdmin) {
      void refreshOrders();
      void refreshProducts();
    }
  }, [loading, session, isAdmin, refreshOrders, refreshProducts]);

  if (loading || !session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        যাচাই করা হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <BrandMark compact />
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            অ্যাডমিন
          </span>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
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
            {email && (
              <span className="hidden px-2 text-xs text-muted-foreground sm:inline">{email}</span>
            )}
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                void signOut().then(() => navigate({ to: "/admin-login", replace: true }));
              }}
            >
              <LogOut className="mr-1 size-4" /> লগআউট
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
