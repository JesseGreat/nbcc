import "server-only";
import type { Member, Tier, User } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { addMonths, formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { ARCHIVE_AFTER_MONTHS } from "@/lib/config";
import { RenewalReminderEmail } from "@/emails/templates";
import { getReminderConfig } from "@/modules/settings/queries";
import { daysLeft, isReminderDue } from "./rules";

type ReminderTarget = Member & { tier: Tier; user: User | null };

/** Email one renewal reminder and log it. */
export async function sendRenewalReminder(m: ReminderTarget, trigger: "manual" | "cron", actorId: string | null) {
  if (!m.expiresAt) return { ok: false as const, error: "No expiry date" };
  const left = daysLeft(m.expiresAt)!;
  const result = await sendEmail({
    to: m.user?.email ?? m.repEmail,
    subject: left < 0 ? "Your NBCC membership has expired" : `Your NBCC membership expires in ${left} days`,
    react: RenewalReminderEmail({
      name: m.repName,
      companyName: m.companyName,
      expiryLabel: formatDate(m.expiresAt),
      daysLeft: left,
      feeLabel: formatMoney(m.tier.feeMinor, m.tier.currency),
      url: `${publicEnv.appUrl}/member/payments`,
    }),
  });
  if (!result.ok) return { ok: false as const, error: result.error };

  await db.reminderLog.create({ data: { memberId: m.id, type: left < 0 ? "EXPIRED" : "RENEWAL_DUE", trigger } });
  await audit({ actorId, action: "reminder.sent", targetType: "Member", targetId: m.id, metadata: { trigger, daysLeft: left } });
  return { ok: true as const };
}

/**
 * Daily job:
 * 1. ACTIVE members past expiry → INACTIVE.
 * 2. INACTIVE members unpaid for ARCHIVE_AFTER_MONTHS → ARCHIVED (records kept).
 * 3. Reminders per schedule (from 90 days before expiry, every 30 days).
 */
export async function runRenewalJob(now = new Date()) {
  const expired = await db.member.findMany({ where: { status: "ACTIVE", expiresAt: { lt: now } }, select: { id: true } });
  for (const { id } of expired) {
    const { count } = await db.member.updateMany({ where: { id, status: "ACTIVE" }, data: { status: "INACTIVE" } });
    if (count) await audit({ actorId: null, action: "member.expired", targetType: "Member", targetId: id, metadata: { from: "ACTIVE", to: "INACTIVE" } });
  }

  const archiveBefore = addMonths(now, -ARCHIVE_AFTER_MONTHS);
  const stale = await db.member.findMany({ where: { status: "INACTIVE", expiresAt: { lt: archiveBefore } }, select: { id: true } });
  for (const { id } of stale) {
    const { count } = await db.member.updateMany({ where: { id, status: "INACTIVE" }, data: { status: "ARCHIVED" } });
    if (count) await audit({ actorId: null, action: "member.auto_archived", targetType: "Member", targetId: id, metadata: { from: "INACTIVE", to: "ARCHIVED" } });
  }

  const cfg = await getReminderConfig();
  const candidates = await db.member.findMany({
    where: {
      status: { in: ["ACTIVE", "INACTIVE"] },
      expiresAt: { not: null, gte: archiveBefore, lte: new Date(now.getTime() + cfg.startDaysBeforeExpiry * 86_400_000) },
    },
    include: { tier: true, user: true, reminders: { orderBy: { sentAt: "desc" }, take: 1 } },
  });

  let sent = 0;
  let failed = 0;
  for (const m of candidates) {
    if (!isReminderDue({ expiresAt: m.expiresAt, lastReminderAt: m.reminders[0]?.sentAt ?? null }, cfg, now)) continue;
    const r = await sendRenewalReminder(m, "cron", null);
    if (r.ok) sent++;
    else failed++;
  }

  return { expired: expired.length, archived: stale.length, remindersSent: sent, remindersFailed: failed, checked: candidates.length };
}
