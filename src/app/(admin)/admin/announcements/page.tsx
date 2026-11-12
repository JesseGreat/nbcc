import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/rbac";
import { can } from "@/lib/roles";
import { formatDateTime } from "@/lib/dates";
import { listAllAnnouncements } from "@/modules/announcements/queries";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  const user = await requireAdmin("members.view");
  const items = await listAllAnnouncements();

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Email updates to members. Sent announcements also appear in the member portal."
        actions={
          can(user.role, "announcements.send") && (
            <Button asChild>
              <Link href="/announcements/new">
                <Plus aria-hidden /> New announcement
              </Link>
            </Button>
          )
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No announcements sent yet" />
      ) : (
        <ul className="grid gap-3">
          {items.map((a) => (
            <li key={a.id} className="rounded-xl border bg-card p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                  {a.audience === "TIER" ? `${a.tier?.name ?? "Tier"} tier` : a.audience === "ACTIVE" ? "Active members" : "All members"}
                </span>
                <span>{a.recipientCount} recipients</span>
                <span>· {formatDateTime(a.sentAt)}</span>
                {a.createdBy && <span>· by {a.createdBy.name}</span>}
              </div>
              <h2 className="mt-2 font-semibold text-primary">{a.title}</h2>
              <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
