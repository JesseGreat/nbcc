import type { Metadata } from "next";
import { Building2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { requireMember } from "@/lib/rbac";
import { logoPublicUrl } from "@/lib/storage";
import { listDirectory, type DirectoryFilters } from "@/modules/directory/queries";
import { listActiveSectors, listActiveTiers } from "@/modules/settings/queries";

export const metadata: Metadata = { title: "Member directory" };

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<DirectoryFilters> }) {
  const user = await requireMember();
  if (user.member.status !== "ACTIVE") {
    return (
      <>
        <PageHeader title="Member directory" />
        <EmptyState icon={Building2} title="The directory is for active members">Pay your membership fee to see and appear in the directory.</EmptyState>
      </>
    );
  }

  const filters = await searchParams;
  const [{ rows, total, page, pageCount }, sectors, tiers] = await Promise.all([listDirectory(filters), listActiveSectors(), listActiveTiers()]);

  return (
    <>
      <PageHeader title="Member directory" description="Active member companies of the Chamber." />
      <FilterBar
        action="/member/directory"
        q={filters.q}
        searchPlaceholder="Search companies"
        selects={[
          { name: "sectorId", label: "Sectors", value: filters.sectorId, options: sectors.map((s) => ({ value: s.id, label: s.name })) },
          { name: "tierId", label: "Tiers", value: filters.tierId, options: tiers.map((t) => ({ value: t.id, label: t.name })) },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState icon={Building2} title="No members found">Try a different search or filter.</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((m) => {
            const logo = logoPublicUrl(m.logoPath);
            return (
              <li key={m.id} className="flex gap-3 rounded-xl border bg-card p-4">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded logo
                  <img src={logo} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg border bg-white object-contain p-1" />
                ) : (
                  <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-primary">
                    {initials(m.companyName)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold break-words">{m.companyName}</p>
                  <p className="text-sm text-muted-foreground">{m.sector.name}</p>
                  <p className="mt-1 text-xs">
                    <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">{m.tier.name}</span>
                  </p>
                  {m.website && (
                    <a
                      href={m.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex min-h-11 max-w-full items-center gap-1 text-sm text-primary hover:underline lg:min-h-8"
                    >
                      <span className="truncate">{m.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
                      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} total={total} basePath="/member/directory" params={{ ...filters }} />
    </>
  );
}

function initials(name: string) {
  return name
    .replace(/[^A-Za-z ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
