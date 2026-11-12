import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export type FilterSelect = {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
};

/**
 * Plain GET form: filters live in the URL (shareable, back-button friendly)
 * and work without JavaScript.
 */
export function FilterBar({
  action,
  q,
  searchPlaceholder = "Search",
  selects,
  extra,
}: {
  action: string;
  q?: string;
  searchPlaceholder?: string;
  selects: FilterSelect[];
  extra?: React.ReactNode;
}) {
  const hasFilters = !!q || selects.some((s) => s.value);
  return (
    <form action={action} method="get" role="search" className="mb-4 grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
      <div className="relative sm:col-span-2 lg:min-w-64 lg:flex-1">
        <label htmlFor="q" className="sr-only">Search</label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input id="q" name="q" type="search" defaultValue={q} placeholder={searchPlaceholder} className="pl-9" />
      </div>
      {selects.map((s) => (
        <div key={s.name} className="lg:w-44">
          <label htmlFor={`f-${s.name}`} className="sr-only">{s.label}</label>
          <NativeSelect id={`f-${s.name}`} name={s.name} defaultValue={s.value ?? ""}>
            <option value="">All {s.label.toLowerCase()}</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </div>
      ))}
      {extra}
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" className="flex-1 lg:flex-none">Apply</Button>
        {hasFilters && (
          <Button asChild variant="ghost" className="flex-1 lg:flex-none">
            <Link href={action}>Clear</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
