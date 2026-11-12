"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Admin pages are rewritten from `admin.<domain>/x` to `/admin/x`, so the pathname
 * may or may not include the /admin prefix. Normalise before comparing.
 */
export function useActivePath() {
  const pathname = usePathname() ?? "/";
  return pathname.replace(/^\/admin(?=\/|$)/, "") || "/";
}

export function isActive(current: string, href: string, exact?: boolean) {
  if (exact || href === "/" || href === "/member") return current === href;
  return current === href || current.startsWith(`${href}/`);
}

type Props = React.ComponentProps<typeof Link> & { href: string; exact?: boolean; activeClassName?: string };

export function NavLink({ href, exact, className, activeClassName, ...props }: Props) {
  const current = useActivePath();
  const active = isActive(current, href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(className, active && activeClassName)}
      {...props}
    />
  );
}
