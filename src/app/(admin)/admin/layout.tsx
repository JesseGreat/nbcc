import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SidebarShell } from "@/components/nav/sidebar-shell";
import { SIDEBAR_COOKIE } from "@/components/nav/sidebar-config";
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

  const collapsed = (await cookies()).get(SIDEBAR_COOKIE.admin)?.value === "1";

  const footer = (
    <div className="space-y-1">
      <div className="px-3 py-1 group-data-[collapsed=true]/sidebar:hidden">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="truncate text-xs text-sidebar-foreground/70">{ROLE_LABELS[user.role]}</p>
      </div>
      <SignOutButton className="text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white" />
      <PoweredBy className="px-3 pt-1 text-sidebar-foreground/60" />
    </div>
  );

  return (
    <SidebarShell
      variant="admin"
      initialCollapsed={collapsed}
      top={
        <>
          <BrandLogo href="/" inverted className="mb-2 px-2 group-data-[collapsed=true]/sidebar:px-0" />
          <p className="mb-5 px-3 text-xs font-semibold tracking-wider text-brand-gold uppercase group-data-[collapsed=true]/sidebar:px-0 group-data-[collapsed=true]/sidebar:text-center group-data-[collapsed=true]/sidebar:text-[10px]">
            Admin
          </p>
        </>
      }
      nav={<AdminSidebarNav role={user.role} />}
      footer={footer}
    >
      <header className="pt-safe sticky top-(--banner-h) z-30 flex h-14 items-center gap-2 border-b bg-card/95 px-2 backdrop-blur lg:hidden">
        <AdminMobileMenu role={user.role} footer={footer} />
        <BrandLogo href="/" />
        <span className="ml-auto rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">Admin</span>
      </header>
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:px-8 md:py-8">
        {children}
      </main>
    </SidebarShell>
  );
}
