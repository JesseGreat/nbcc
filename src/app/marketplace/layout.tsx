import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "./_lib/store";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Marketplace (test)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
          <Link href="/marketplace" className="flex items-center gap-2 font-semibold">
            <ShoppingBag className="size-5" aria-hidden />
            Marketplace <span className="text-xs font-normal text-muted-foreground">(escrow test)</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/marketplace/orders">My orders</Link>
                </Button>
                <form action={logoutAction}>
                  <Button type="submit" variant="outline" size="sm">
                    Log out ({user.username})
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/marketplace/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/marketplace/signup">Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
