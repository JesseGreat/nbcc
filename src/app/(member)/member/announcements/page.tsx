import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requireMember } from "@/lib/rbac";
import { formatDate } from "@/lib/dates";
import { listAnnouncementsForMember } from "@/modules/announcements/queries";

export const metadata: Metadata = { title: "Announcements" };

export default async function MemberAnnouncementsPage() {
  const user = await requireMember();
  const items = await listAnnouncementsForMember(user.member, 50);

  return (
    <>
      <PageHeader title="Announcements" description="News and updates from the Chamber." />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No announcements yet" />
      ) : (
        <ul className="grid gap-3">
          {items.map((a) => (
            <li key={a.id}>
              <article className="rounded-xl border bg-card p-5">
                <p className="text-xs text-muted-foreground">
                  <time dateTime={a.sentAt?.toISOString()}>{formatDate(a.sentAt)}</time>
                </p>
                <h2 className="mt-1 text-lg font-semibold text-primary">{a.title}</h2>
                <div className="mt-2 space-y-3 text-sm leading-relaxed">
                  {a.body.split(/\n{2,}/).map((p, i) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
