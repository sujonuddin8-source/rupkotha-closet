import { Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/types";
import { BrandMark } from "./SiteHeader";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-3">
        <div className="space-y-3">
          <BrandMark />
          <p className="max-w-xs text-sm text-muted-foreground">
            শিশুদের জন্য আরামদায়ক ও সুন্দর পোশাক। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">ক্যাটাগরি</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">যোগাযোগ</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>হটলাইন: ০১৭০০-০০০০০০</li>
            <li>ইমেইল: hello@rupkothafashion.com</li>
            <li>ঢাকা, বাংলাদেশ</li>
            <li>
              <Link to="/admin" className="hover:text-foreground">
                অ্যাডমিন প্যানেল
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">
        © ২০২৬ রূপকথা ফ্যাশন — সর্বস্বত্ব সংরক্ষিত
      </div>
    </footer>
  );
}
