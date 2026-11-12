/**
 * Application configuration that is not stored in the database.
 * Tiers and sectors live in the database (Tier, Sector tables); reminder
 * intervals can be overridden by the `reminders` Setting row.
 */

export const MEMBERSHIP_PERIOD_MONTHS = 12;

/** Members unpaid this long after expiry are archived (records preserved). */
export const ARCHIVE_AFTER_MONTHS = 12;

/**
 * When an ACTIVE member renews before expiry, the new period starts at the old
 * expiry date so they do not lose remaining days. Set false to start the new
 * period at the payment date instead.
 */
export const RENEWAL_EXTENDS_FROM_EXPIRY = true;

export type ReminderConfig = {
  /** Start reminding this many days before expiry. */
  startDaysBeforeExpiry: number;
  /** Then repeat every N days. */
  intervalDays: number;
};

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  startDaysBeforeExpiry: 90,
  intervalDays: 30,
};

export const UPLOADS = {
  maxBytes: 5 * 1024 * 1024,
  logoMaxBytes: 2 * 1024 * 1024,
  documentMimeTypes: ["application/pdf", "image/jpeg", "image/png"] as const,
  logoMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as const,
  documentsBucket: "member-documents",
  logosBucket: "member-logos",
};

export const PAGE_SIZE = 20;

export const MEMBERSHIP_NUMBER_PREFIX = "NBCC";
export const RECEIPT_NUMBER_PREFIX = "NBCC-RCT";

export const ORG = {
  name: "Nigerian-British Chamber of Commerce",
  shortName: "NBCC",
  portalName: "NBCC Member Portal",
  supportEmail: "membership@example.com",
  poweredBy: "Zypa Tech Limited",
};
