/**
 * Label bubble shown beside an icon when the sidebar is collapsed.
 * Purely visual (aria-hidden): the real label stays in the DOM as sr-only text.
 * Requires an ancestor with `group/sidebar` (the aside) and `group/item` (the link/button).
 */
export function SidebarTooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 hidden -translate-y-1/2 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-background opacity-0 shadow-lg transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100 group-data-[collapsed=true]/sidebar:block"
    >
      {children}
    </span>
  );
}

/** Classes for a sidebar row (link or button) that shrinks to an icon when collapsed. */
export const sidebarItemClass =
  "group/item relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-white group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:px-0";

/** Text inside a sidebar row: visible when expanded, screen-reader only when collapsed. */
export const sidebarLabelClass = "truncate group-data-[collapsed=true]/sidebar:sr-only";
