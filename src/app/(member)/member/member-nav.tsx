"use client";

import { Bell, Building2, CreditCard, LayoutDashboard, UserRound } from "lucide-react";
import { NavLink } from "@/components/nav/nav-link";
import { SidebarTooltip, sidebarItemClass, sidebarLabelClass } from "@/components/nav/sidebar-tooltip";

export const MEMBER_NAV = [
  { href: "/member", label: "Home", icon: LayoutDashboard },
  { href: "/member/payments", label: "Payments", icon: CreditCard },
  { href: "/member/directory", label: "Directory", icon: Building2 },
  { href: "/member/announcements", label: "News", icon: Bell },
  { href: "/member/profile", label: "Profile", icon: UserRound },
] as const;

export function MemberSidebarNav() {
  return (
    <nav aria-label="Member" className="flex flex-col gap-1">
      {MEMBER_NAV.map(({ href, label, icon: Icon }) => {
        const text = label === "News" ? "Announcements" : label;
        return (
          <NavLink key={href} href={href} className={sidebarItemClass} activeClassName="bg-sidebar-accent text-white">
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className={sidebarLabelClass}>{text}</span>
            <SidebarTooltip>{text}</SidebarTooltip>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function MemberBottomNav() {
  return (
    <nav
      aria-label="Member"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 md:hidden"
    >
      <ul className="grid grid-cols-5">
        {MEMBER_NAV.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <NavLink
              href={href}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
              activeClassName="text-primary"
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
