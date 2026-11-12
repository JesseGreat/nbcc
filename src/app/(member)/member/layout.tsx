import { BrandLogo, PoweredBy } from "@/components/brand";
import { SignOutButton } from "@/components/nav/sign-out-button";
import { requireMember } from "@/lib/rbac";
import { MemberBottomNav, MemberSidebarNav } from "./member-nav";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireMember();

  return (
    <div className="min-h-dvh-screen md:grid md:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <BrandLogo href="/member" inverted className="mb-6 px-2" />
        <MemberSidebarNav />
        <div className="mt-auto space-y-3 border-t border-sidebar-border pt-4">
          <div className="px-3">
            <p className="truncate text-sm font-semibold text-white">{user.member.companyName}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">{user.email}</p>
          </div>
          <SignOutButton className="text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white" />
          <PoweredBy className="px-3 text-sidebar-foreground/60" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur md:hidden">
          <BrandLogo href="/member" />
          <SignOutButton className="w-auto px-2 text-muted-foreground hover:text-foreground" />
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-10">
          {children}
        </main>
        <PoweredBy className="pb-24 text-center md:hidden" />
      </div>

      <MemberBottomNav />
    </div>
  );
}
