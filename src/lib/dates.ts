/** Dates are displayed in Lagos time (WAT) with British formatting. */
const TZ = "Africa/Lagos";

export function formatDate(d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ, ...opts }).format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined): string {
  return formatDate(d, { hour: "2-digit", minute: "2-digit" });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from now until `d` (negative when in the past). */
export function daysUntil(d: Date | string, now = new Date()): number {
  return Math.ceil((new Date(d).getTime() - now.getTime()) / DAY_MS);
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

export function addMonths(d: Date, months: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return out;
}
