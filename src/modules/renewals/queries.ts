import "server-only";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/rbac";
import { addDays } from "@/lib/dates";
import { getReminderConfig } from "@/modules/settings/queries";
import { isReminderDue } from "./rules";

/** ACTIVE members expiring within the reminder window (90 days by default), soonest first. */
export async function listExpiring(now = new Date()) {
  await assertPermission("members.view");
  const cfg = await getReminderConfig();
  const rows = await db.member.findMany({
    where: { status: "ACTIVE", expiresAt: { gte: now, lte: addDays(now, cfg.startDaysBeforeExpiry) } },
    orderBy: { expiresAt: "asc" },
    include: { tier: true, reminders: { orderBy: { sentAt: "desc" }, take: 1 } },
  });
  return rows.map((m) => ({
    ...m,
    lastReminderAt: m.reminders[0]?.sentAt ?? null,
    reminderDue: isReminderDue({ expiresAt: m.expiresAt, lastReminderAt: m.reminders[0]?.sentAt ?? null }, cfg, now),
  }));
}
