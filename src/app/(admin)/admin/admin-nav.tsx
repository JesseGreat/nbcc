"use client";

import { useState } from "react";
import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { NavLink } from "@/components/nav/nav-link";
import { SidebarTooltip, sidebarItemClass, sidebarLabelClass } from "@/components/nav/sidebar-tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/brand";
import type { AppRole } from "@/lib/roles";
import { can } from "@/lib/roles";

// Admin is served on its own subdomain, so links have no /admin prefix.
function navItems(role: AppRole) {
  return [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/applications", label: "Applications", icon: ClipboardCheck, show: true },
    { href: "/members", label: "Members", icon: Users, show: true },
    { href: "/payments", label: "Payments", icon: CreditCard, show: can(role, "payments.view") },
    { href: "/renewals", label: "Renewals", icon: CalendarClock, show: true },
    { href: "/announcements", label: "Announcements", icon: Bell, show: true },
    { href: "/settings", label: "Settings", icon: Settings, show: can(role, "settings.manage") },
  ].filter((i) => i.show);
}

function NavList({ role, onNavigate }: { role: AppRole; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {navItems(role).map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          href={href}
          onClick={onNavigate}
          className={sidebarItemClass}
          activeClassName="bg-sidebar-accent text-white"
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <span className={sidebarLabelClass}>{label}</span>
          <SidebarTooltip>{label}</SidebarTooltip>
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminSidebarNav({ role }: { role: AppRole }) {
  return <NavList role={role} />;
}

export function AdminMobileMenu({ role, footer }: { role: AppRole; footer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-lg text-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
        <SheetHeader className="p-0">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <BrandLogo href="/" inverted className="mb-4" />
        </SheetHeader>
        <NavList role={role} onNavigate={() => setOpen(false)} />
        <div className="mt-auto border-t border-sidebar-border pt-4">{footer}</div>
      </SheetContent>
    </Sheet>
  );
}
