"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_COOKIE } from "./sidebar-config";


/**
 * Desktop layout with a sticky sidebar that collapses to an icon rail.
 * The collapsed state lives in a cookie so the server renders it correctly (no flicker).
 * Children of the aside adapt with `group-data-[collapsed=true]/sidebar:*` classes.
 * Member shows the sidebar from md, admin from lg (below that they use bottom nav / sheet menu).
 */
export function SidebarShell({
  variant,
  initialCollapsed,
  top,
  label,
  nav,
  footer,
  children,
}: {
  variant: "member" | "admin";
  initialCollapsed: boolean;
  top: React.ReactNode;
  /** Small caption shown beside the collapse toggle (e.g. "Admin"). */
  label?: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE[variant]}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };

  const grid =
    variant === "member"
      ? collapsed
        ? "md:grid md:grid-cols-[4.5rem_1fr]"
        : "md:grid md:grid-cols-[16rem_1fr]"
      : collapsed
        ? "lg:grid lg:grid-cols-[4.5rem_1fr]"
        : "lg:grid lg:grid-cols-[16rem_1fr]";

  return (
    <div className={cn("min-h-dvh-screen transition-[grid-template-columns] duration-200", grid)}>
      <aside
        data-collapsed={collapsed}
        aria-label={variant === "member" ? "Member navigation" : "Admin navigation"}
        className={cn(
          "nbcc-sidebar group/sidebar sticky top-(--banner-h) z-40 hidden h-[calc(100dvh-var(--banner-h))] flex-col bg-sidebar text-sidebar-foreground",
          variant === "member" ? "md:flex" : "lg:flex",
          collapsed ? "px-2 py-4" : "p-4",
        )}
      >
        {top}
        <div className="mb-4 flex items-center justify-between gap-2 pl-3 group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:pl-0">
          <span className="text-xs font-semibold tracking-wider text-brand-gold uppercase group-data-[collapsed=true]/sidebar:hidden">{label}</span>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-white"
          >
            {collapsed ? <PanelLeftOpen className="size-4" aria-hidden /> : <PanelLeftClose className="size-4" aria-hidden />}
          </button>
        </div>
        {nav}
        <div className="mt-auto space-y-1 border-t border-sidebar-border pt-3">
          {footer}
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">{children}</div>
    </div>
  );
}
