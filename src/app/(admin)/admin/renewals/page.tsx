import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requireAdmin } from "@/lib/rbac";
import { can } from "@/lib/roles";
import { daysUntil, formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { listExpiring } from "@/modules/renewals/queries";
import { BulkReminderButton, ReminderButton } from "@/modules/renewals/components/reminder-buttons";

export const metadata: Metadata = { title: "Renewals" };

export default async function RenewalsPage() {
  const user = await requireAdmin("members.view");
  const rows = await listExpiring();
  const canRemind = can(user.role, "renewals.remind");
  const due = rows.filter((r) => r.reminderDue).map((r) => r.id);

  return (
    <>
      <PageHeader
        title="Renewals"
        description="Active members whose membership expires in the next 90 days. Reminders also go out automatically every day."
        actions={canRemind && rows.length > 0 && <BulkReminderButton memberIds={due.length ? due : rows.map((r) => r.id)} label={due.length ? `Send ${due.length} due reminders` : `Remind all ${rows.length}`} />}
      />
      {rows.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No memberships expiring in the next 90 days" />
      ) : (
        <ul className="grid gap-3">
          {rows.map((m) => {
            const days = daysUntil(m.expiresAt!);
            return (
              <li key={m.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
                <div
                  className={cn(
                    "flex size-14 shrink-0 flex-col items-center justify-center rounded-lg text-center",
                    days <= 30 ? "bg-destructive/10 text-destructive" : "bg-warning-soft text-warning",
                  )}
                  aria-hidden
                >
                  <span className="text-lg leading-none font-bold">{days}</span>
                  <span className="text-[10px] font-medium uppercase">days</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/members/${m.id}`} className="font-semibold text-primary hover:underline">
                    {m.companyName}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {m.membershipNumber} · {m.tier.name} · {formatMoney(m.tier.feeMinor, m.tier.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="sr-only">{days} days left. </span>Expires {formatDate(m.expiresAt)} · Last reminder:{" "}
                    {m.lastReminderAt ? formatDate(m.lastReminderAt) : "never"}
                    {m.reminderDue && <span className="ml-1 font-semibold text-warning">· reminder due</span>}
                  </p>
                </div>
                {canRemind && <ReminderButton memberId={m.id} />}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
