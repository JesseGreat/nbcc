import Link from "next/link";
import { BrandLogo, PoweredBy } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ORG } from "@/lib/config";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
          <BrandLogo />
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/register">Apply</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="pb-safe border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {ORG.name}
          </p>
          <PoweredBy />
        </div>
      </footer>
    </div>
  );
}
