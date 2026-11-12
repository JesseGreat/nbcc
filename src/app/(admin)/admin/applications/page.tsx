import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MemberStatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/rbac";
import { formatDate } from "@/lib/dates";
import { listApplications } from "@/modules/members/queries";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  await requireAdmin("members.view");
  const apps = await listApplications();
  const pending = apps.filter((a) => a.status === "PENDING_APPROVAL");
  const unverified = apps.filter((a) => a.status === "PENDING_VERIFICATION");

  return (
    <>
      <PageHeader title="Applications" description={`${pending.length} waiting for a decision`} />
      {pending.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No applications waiting">New applications appear here once the applicant confirms their email.</EmptyState>
      ) : (
        <AppList apps={pending} />
      )}
      {unverified.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-lg font-semibold text-primary">Awaiting email confirmation</h2>
          <AppList apps={unverified} />
        </>
      )}
    </>
  );
}

function AppList({ apps }: { apps: Awaited<ReturnType<typeof listApplications>> }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {apps.map((a) => (
        <li key={a.id}>
          <Link href={`/applications/${a.id}`} className="flex h-full items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{a.companyName}</p>
              <p className="truncate text-sm text-muted-foreground">
                {a.tier.name} · {a.sector.name}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <MemberStatusBadge status={a.status} />
                <span>Applied {formatDate(a.createdAt)}</span>
                <span>{a._count.documents} document{a._count.documents === 1 ? "" : "s"}</span>
              </div>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
