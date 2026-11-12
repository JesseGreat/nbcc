import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/env";
import { toMajor } from "@/lib/money";
import { Section } from "@/modules/members/components/member-sections";
import { getReminderConfig, listAllSectors, listAllTiers } from "@/modules/settings/queries";
import {
  InviteStaffForm,
  ReminderSettingsForm,
  ResetDemoButton,
  SectorRow,
  StaffRow,
  TierRow,
} from "@/modules/settings/components/settings-forms";

export const metadata: Metadata = { title: "Settings" };
// The demo reset action runs from this page and can take a while on a remote database.
export const maxDuration = 60;

export default async function SettingsPage() {
  const user = await requireAdmin("settings.manage");
  const [tiers, sectors, reminders, staff] = await Promise.all([
    listAllTiers(),
    listAllSectors(),
    getReminderConfig(),
    db.user.findMany({ where: { role: { not: "MEMBER" } }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <>
      <PageHeader title="Settings" description="Tiers, fees, sectors, reminders and staff access. Changes are recorded in the audit log." />
      <div className="grid gap-4">
        <Section title="Membership tiers and annual fees">
          <p className="mb-3 text-sm text-muted-foreground">Fee changes apply to new payments only. Inactive tiers are hidden from new applicants.</p>
          <div className="grid gap-3">
            {tiers.map((t) => (
              <TierRow key={t.id} tier={{ id: t.id, name: t.name, description: t.description, feeMajor: toMajor(t.feeMinor), isActive: t.isActive, members: t._count.members }} />
            ))}
            <TierRow />
          </div>
        </Section>

        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Sectors">
            <div>
              {sectors.map((s) => (
                <SectorRow key={s.id} sector={{ id: s.id, name: s.name, isActive: s.isActive, members: s._count.members }} />
              ))}
              <SectorRow />
            </div>
          </Section>
          <Section title="Renewal reminders">
            <ReminderSettingsForm startDays={reminders.startDaysBeforeExpiry} interval={reminders.intervalDays} />
            <p className="mt-3 text-xs text-muted-foreground">The daily job emails members from this many days before expiry, repeating at this interval.</p>
          </Section>
        </div>

        <Section title="Staff accounts">
          <ul>
            {staff.map((s) => (
              <StaffRow key={s.id} staff={{ id: s.id, name: s.name, email: s.email, role: s.role as "SUPER_ADMIN" | "ADMIN" | "STAFF", isDisabled: s.isDisabled }} isSelf={s.id === user.id} />
            ))}
          </ul>
          <h3 className="mt-5 mb-2 text-sm font-semibold">Invite a staff member</h3>
          <InviteStaffForm />
          <p className="mt-3 text-xs text-muted-foreground">
            Super admin: everything. Admin: approvals, member changes, payments export, announcements. Staff: view, and send renewal reminders.
          </p>
        </Section>

        {isDemoMode() && (
          <Section title="Demo environment">
            <p className="mb-3 text-sm text-muted-foreground">Restore the demo to its starting state before a presentation.</p>
            <ResetDemoButton />
          </Section>
        )}
      </div>
    </>
  );
}
