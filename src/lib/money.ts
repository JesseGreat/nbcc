/** All money is stored as integers in minor units (kobo for NGN, pence for GBP). */

export type CurrencyCode = "NGN" | "GBP";

const LOCALES: Record<CurrencyCode, string> = {
  NGN: "en-NG",
  GBP: "en-GB",
};

export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode = "NGN",
  options: { compact?: boolean } = {},
): string {
  return new Intl.NumberFormat(LOCALES[currency], {
    style: "currency",
    currency,
    notation: options.compact ? "compact" : "standard",
    minimumFractionDigits: options.compact ? 0 : 0,
    maximumFractionDigits: options.compact ? 1 : 2,
  }).format(amountMinor / 100);
}

/** Convert a major-unit amount (e.g. 1500000 naira) to minor units (kobo). */
export function toMinor(amountMajor: number): number {
  return Math.round(amountMajor * 100);
}

export function toMajor(amountMinor: number): number {
  return amountMinor / 100;
}
