import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "অ্যাডমিন লগইন — রূপকথা ফ্যাশন" },
      { name: "description", content: "রূপকথা ফ্যাশনের অ্যাডমিন প্যানেলে নিরাপদে প্রবেশ করুন।" },
      { property: "og:title", content: "অ্যাডমিন লগইন — রূপকথা ফ্যাশন" },
      { property: "og:description", content: "অনুমোদিত অ্যাডমিনদের জন্য লগইন পেজ।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const { signIn, session, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session && isAdmin) void navigate({ to: "/admin", replace: true });
  }, [loading, session, isAdmin, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "লগইন ব্যর্থ হয়েছে");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <BrandMark />
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-3xl border border-border/70 bg-card p-6"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <h1 className="text-lg font-bold">অ্যাডমিন লগইন</h1>
        </div>
        <div>
          <Label htmlFor="email">ইমেইল</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1.5 rounded-xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">পাসওয়ার্ড</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1.5 rounded-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && session && !isAdmin && (
          <div className="space-y-2 rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
            <p>এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।</p>
            <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => void signOut()}>
              লগআউট
            </Button>
          </div>
        )}
        <Button type="submit" className="w-full rounded-full" disabled={busy}>
          {busy && <Loader2 className="mr-1 size-4 animate-spin" />}
          লগইন করুন
        </Button>
      </form>
    </div>
  );
}
