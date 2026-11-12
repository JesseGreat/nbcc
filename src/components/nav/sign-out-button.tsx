import { LogOut } from "lucide-react";
import { signOutAction } from "@/modules/auth/actions";
import { cn } from "@/lib/utils";
import { SidebarTooltip, sidebarLabelClass } from "./sidebar-tooltip";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={cn(
          "group/item relative flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:px-0",
          className,
        )}
      >
        <LogOut className="size-4 shrink-0" aria-hidden />
        <span className={sidebarLabelClass}>Sign out</span>
        <SidebarTooltip>Sign out</SidebarTooltip>
      </button>
    </form>
  );
}
