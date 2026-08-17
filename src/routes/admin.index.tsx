import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, PackageCheck, ShoppingCart, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { bdt, STATUS_LABEL, toBn } from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "অ্যাডমিন ড্যাশবোর্ড — রূপকথা ফ্যাশন" },
      { name: "description", content: "বিক্রয়, অর্ডার ও স্টকের সারসংক্ষেপ দেখুন।" },
      { property: "og:title", content: "অ্যাডমিন ড্যাশবোর্ড — রূপকথা ফ্যাশন" },
      { property: "og:description", content: "স্টোরের মেট্রিক ও সাম্প্রতিক অর্ডার।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { orders, products } = useStore();
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const stock = products.reduce((s, p) => s + p.stock, 0);

  const cards = [
    { icon: Wallet, label: "মোট বিক্রয়", value: bdt(revenue) },
    { icon: ShoppingCart, label: "মোট অর্ডার", value: toBn(orders.length) },
    { icon: PackageCheck, label: "পেন্ডিং অর্ডার", value: toBn(pending) },
    { icon: Boxes, label: "মোট স্টক", value: toBn(stock) },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">ড্যাশবোর্ড</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-3xl border border-border/70 bg-card p-5">
            <c.icon className="size-5 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">সাম্প্রতিক অর্ডার</h2>
          <Link to="/admin/orders" className="text-sm text-primary hover:underline">
            সব দেখুন
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">এখনো কোনো অর্ডার নেই।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">অর্ডার আইডি</th>
                  <th>ক্রেতা</th>
                  <th>মোট</th>
                  <th>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="py-2.5 font-medium">{o.id}</td>
                    <td>{o.customerName}</td>
                    <td>{bdt(o.total)}</td>
                    <td>
                      <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">
                        {STATUS_LABEL[o.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <h2 className="mb-4 text-lg font-bold">কম স্টকের পণ্য</h2>
        <ul className="space-y-2 text-sm">
          {products
            .filter((p) => p.stock <= 12)
            .map((p) => (
              <li key={p.id} className="flex justify-between border-b border-border py-2 last:border-0">
                <span>{p.name}</span>
                <span className="font-semibold text-destructive">{toBn(p.stock)} পিস</span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
