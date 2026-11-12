/**
 * Pure membership-period rules shared by the member dashboard, payments and
 * the renewal job. No server imports so they are easy to unit test.
 */
import type { MemberStatus } from "@prisma/client";
import { DEFAULT_REMINDER_CONFIG, MEMBERSHIP_PERIOD_MONTHS, RENEWAL_EXTENDS_FROM_EXPIRY, type ReminderConfig } from "@/lib/config";

const DAY_MS = 24 * 60 * 60 * 1000;

export type PayState =
  | { canPay: false; reason: string }
  | { canPay: true; purpose: "NEW" | "RENEWAL"; label: "Pay now" | "Renew now"; urgent: boolean };

export function daysLeft(expiresAt: Date | null, now = new Date()): number | null {
  if (!expiresAt) return null;
  return Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS);
}

/** Whether the member can pay now, and whether it counts as a new membership or a renewal. */
export function getPayState(
  m: { status: MemberStatus; expiresAt: Date | null; hasPaidBefore: boolean },
  cfg: ReminderConfig = DEFAULT_REMINDER_CONFIG,
  now = new Date(),
): PayState {
  const purpose = m.hasPaidBefore ? "RENEWAL" : "NEW";
  switch (m.status) {
    case "INACTIVE":
    case "ARCHIVED":
      return { canPay: true, purpose, label: m.hasPaidBefore ? "Renew now" : "Pay now", urgent: true };
    case "ACTIVE": {
      const d = daysLeft(m.expiresAt, now);
      if (d === null || d <= cfg.startDaysBeforeExpiry) return { canPay: true, purpose: "RENEWAL", label: "Renew now", urgent: d === null || d <= 30 };
      return { canPay: false, reason: `Renewal opens ${cfg.startDaysBeforeExpiry} days before expiry.` };
    }
    default:
      return { canPay: false, reason: "Payments are not available for this account." };
  }
}

/** The 12-month period a successful payment buys. */
export function computePeriod(m: { status: MemberStatus; expiresAt: Date | null }, paidAt: Date) {
  const extendFromExpiry = RENEWAL_EXTENDS_FROM_EXPIRY && m.status === "ACTIVE" && m.expiresAt && m.expiresAt > paidAt;
  const periodStart = extendFromExpiry ? new Date(m.expiresAt!) : new Date(paidAt);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + MEMBERSHIP_PERIOD_MONTHS);
  return { periodStart, periodEnd };
}

/**
 * Reminder schedule: from `startDaysBeforeExpiry` days before expiry, one reminder
 * per `intervalDays` window (90, 60, 30 days before by default), plus one after expiry.
 */
export function isReminderDue(
  m: { expiresAt: Date | null; lastReminderAt: Date | null },
  cfg: ReminderConfig = DEFAULT_REMINDER_CONFIG,
  now = new Date(),
): boolean {
  const d = daysLeft(m.expiresAt, now);
  if (d === null || d > cfg.startDaysBeforeExpiry) return false;
  if (!m.lastReminderAt) return true;
  const sinceLast = (now.getTime() - m.lastReminderAt.getTime()) / DAY_MS;
  return sinceLast >= cfg.intervalDays;
}
