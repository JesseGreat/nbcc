import Image from "next/image";
import Link from "next/link";
import { ORG } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * NBCC brand assets live in /public/brand:
 *  - nbcc-logo.png    full crest with "Nigerian-British Chamber of Commerce" wordmark
 *  - nbcc-emblem.png  crest only (for small sizes, where the wordmark would be unreadable)
 * The crest has dark lettering on a transparent background, so on navy
 * surfaces it sits on a white tile (as on nbcc.org.ng).
 */
export function BrandLogo({ href = "/", className, inverted }: { href?: string; className?: string; inverted?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-11 items-center gap-2.5", className)} aria-label={`${ORG.portalName} home`}>
      <span className={cn("inline-flex shrink-0 items-center", inverted && "rounded-md bg-white p-1")}>
        <Image src="/brand/nbcc-emblem.png" alt="" width={251} height={160} priority className="h-8 w-auto" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn("text-sm font-extrabold tracking-wide", inverted ? "text-white" : "text-primary")}>{ORG.shortName}</span>
        <span className={cn("text-[11px] font-medium", inverted ? "text-sidebar-foreground/75" : "text-muted-foreground")}>Member Portal</span>
      </span>
    </Link>
  );
}

/** Full crest with wordmark, for hero and sign-in screens. */
export function BrandCrest({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/nbcc-logo.png"
      alt={ORG.name}
      width={640}
      height={515}
      priority={priority}
      className={cn("h-auto w-40", className)}
    />
  );
}

export function PoweredBy({ className }: { className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>Powered by {ORG.poweredBy}</p>;
}
