import { cookies } from "next/headers";
import { BrandLogo, PoweredBy } from "@/components/brand";
import { SidebarShell } from "@/components/nav/sidebar-shell";
import { SIDEBAR_COOKIE } from "@/components/nav/sidebar-config";
import { SignOutButton } from "@/components/nav/sign-out-button";
import { requireMember } from "@/lib/rbac";
import { GATED_STATUSES, MemberStatusScreen } from "@/modules/members/components/status-screen";
import { MemberBottomNav, MemberSidebarNav } from "./member-nav";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireMember();

  // Not yet approved (or rejected / suspended): show a status screen instead of the portal.
  if (GATED_STATUSES.includes(user.member.status)) {
    return (
      <div className="min-h-dvh-screen flex flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4">
          <BrandLogo href="/member" />
          <SignOutButton className="w-auto px-2 text-muted-foreground hover:text-foreground" />
        </header>
        <main id="main" className="flex-1 px-4">
          <MemberStatusScreen
            status={user.member.status}
            companyName={user.member.companyName}
            rejectionReason={user.member.rejectionReason}
          />
        </main>
        <PoweredBy className="pb-safe py-4 text-center" />
      </div>
    );
  }

  const collapsed = (await cookies()).get(SIDEBAR_COOKIE.member)?.value === "1";

  return (
    <>
      <SidebarShell
        variant="member"
        initialCollapsed={collapsed}
        top={<BrandLogo href="/member" inverted className="mb-2 px-2 group-data-[collapsed=true]/sidebar:px-0" />}
        nav={<MemberSidebarNav />}
        footer={
          <>
            <div className="px-3 py-1 group-data-[collapsed=true]/sidebar:hidden">
              <p className="truncate text-sm font-semibold text-white">{user.member.companyName}</p>
              <p className="truncate text-xs text-sidebar-foreground/70">{user.email}</p>
            </div>
            <SignOutButton className="text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white" />
            <PoweredBy className="px-3 pt-1 text-sidebar-foreground/60" />
          </>
        }
      >
        <header className="sticky top-(--banner-h) z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur md:hidden">
          <BrandLogo href="/member" />
          <SignOutButton className="w-auto px-2 text-muted-foreground hover:text-foreground" />
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-10">
          {children}
        </main>
        <PoweredBy className="pb-24 text-center md:hidden" />
      </SidebarShell>
      <MemberBottomNav />
    </>
  );
}
