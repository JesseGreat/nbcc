import { LogOut } from "lucide-react";
import { signOutAction } from "@/modules/auth/actions";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
          className,
        )}
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </button>
    </form>
  );
}
