import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Link-based pagination that preserves the current filters. */
export function Pagination({
  page,
  pageCount,
  total,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return <p className="mt-4 text-sm text-muted-foreground">{total} result{total === 1 ? "" : "s"}</p>;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && k !== "page" && sp.set(k, v));
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const linkClass = "inline-flex min-h-11 items-center gap-1 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted md:min-h-9";

  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount} · {total} results
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={linkClass} rel="prev">
            <ChevronLeft className="size-4" aria-hidden /> <span className="sr-only sm:not-sr-only">Previous</span>
          </Link>
        ) : (
          <span className={cn(linkClass, "pointer-events-none opacity-40")} aria-hidden>
            <ChevronLeft className="size-4" />
          </span>
        )}
        {page < pageCount ? (
          <Link href={href(page + 1)} className={linkClass} rel="next">
            <span className="sr-only sm:not-sr-only">Next</span> <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <span className={cn(linkClass, "pointer-events-none opacity-40")} aria-hidden>
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
