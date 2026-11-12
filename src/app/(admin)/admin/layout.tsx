import type { Metadata } from "next";
import { BrandLogo, PoweredBy } from "@/components/brand";
import { SignOutButton } from "@/components/nav/sign-out-button";
import { requireAdmin } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/roles";
import { AdminMobileMenu, AdminSidebarNav } from "./admin-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · NBCC Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  const footer = (
    <div className="space-y-3">
      <div className="px-3">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="truncate text-xs text-sidebar-foreground/70">{ROLE_LABELS[user.role]}</p>
      </div>
      <SignOutButton className="text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white" />
      <PoweredBy className="px-3 text-sidebar-foreground/60" />
    </div>
  );

  return (
    <div className="min-h-dvh-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-sidebar p-4 text-sidebar-foreground lg:flex">
        <BrandLogo href="/" inverted className="mb-2 px-2" />
        <p className="mb-5 px-3 text-xs font-semibold tracking-wider text-brand-gold uppercase">Admin</p>
        <AdminSidebarNav role={user.role} />
        <div className="mt-auto border-t border-sidebar-border pt-4">{footer}</div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="pt-safe sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/95 px-2 backdrop-blur lg:hidden">
          <AdminMobileMenu role={user.role} footer={footer} />
          <BrandLogo href="/" />
          <span className="ml-auto rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">Admin</span>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
