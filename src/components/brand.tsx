import Image from "next/image";
import Link from "next/link";
import { ORG } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Logo from /public/brand/logo.svg — drop the real NBCC logo there to rebrand. */
export function BrandLogo({ href = "/", className, inverted }: { href?: string; className?: string; inverted?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-11 items-center gap-2", className)} aria-label={`${ORG.portalName} home`}>
      <Image
        src={inverted ? "/brand/logo-inverted.svg" : "/brand/logo.svg"}
        alt=""
        width={168}
        height={36}
        priority
        className="h-8 w-auto"
      />
    </Link>
  );
}

export function PoweredBy({ className }: { className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>Powered by {ORG.poweredBy}</p>;
}
