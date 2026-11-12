import type { Metadata } from "next";
import { Users } from "lucide-react";
import { MemberStatus } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { MEMBER_STATUS_LABELS } from "@/components/status-badge";
import { requireAdmin } from "@/lib/rbac";
import { listMembers, type MemberListFilters } from "@/modules/members/queries";
import { listAllSectors, listAllTiers } from "@/modules/settings/queries";
import { MembersTable } from "@/modules/members/components/admin/members-table";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<MemberListFilters> }) {
  await requireAdmin("members.view");
  const filters = await searchParams;
  const [{ rows, total, page, pageCount }, tiers, sectors] = await Promise.all([listMembers(filters), listAllTiers(), listAllSectors()]);

  return (
    <>
      <PageHeader title="Members" description="All member companies and applicants." />
      <FilterBar
        action="/members"
        q={filters.q}
        searchPlaceholder="Company, membership no., email or RC"
        selects={[
          { name: "status", label: "Statuses", value: filters.status, options: Object.values(MemberStatus).map((s) => ({ value: s, label: MEMBER_STATUS_LABELS[s] })) },
          { name: "tierId", label: "Tiers", value: filters.tierId, options: tiers.map((t) => ({ value: t.id, label: t.name })) },
          { name: "sectorId", label: "Sectors", value: filters.sectorId, options: sectors.map((s) => ({ value: s.id, label: s.name })) },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No members match these filters" />
      ) : (
        <MembersTable rows={rows} />
      )}
      <Pagination page={page} pageCount={pageCount} total={total} basePath="/members" params={{ ...filters }} />
    </>
  );
}
