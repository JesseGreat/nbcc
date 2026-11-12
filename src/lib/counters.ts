import type { Prisma } from "@prisma/client";
import { MEMBERSHIP_NUMBER_PREFIX, RECEIPT_NUMBER_PREFIX } from "@/lib/config";

type Tx = Prisma.TransactionClient;

/**
 * Atomically increment and return the next value of a named counter.
 * The upsert takes a row lock, so concurrent transactions are serialised
 * and numbers are sequential with no duplicates.
 */
export async function nextSequence(tx: Tx, key: string): Promise<number> {
  const rows = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "Counter" ("key", "value") VALUES (${key}, 1)
    ON CONFLICT ("key") DO UPDATE SET "value" = "Counter"."value" + 1
    RETURNING "value"`;
  return rows[0].value;
}

/** NBCC-YYYY-0001 */
export async function nextMembershipNumber(tx: Tx, date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const n = await nextSequence(tx, `membership:${year}`);
  return `${MEMBERSHIP_NUMBER_PREFIX}-${year}-${String(n).padStart(4, "0")}`;
}

/** NBCC-RCT-YYYY-000001 */
export async function nextReceiptNumber(tx: Tx, date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const n = await nextSequence(tx, `receipt:${year}`);
  return `${RECEIPT_NUMBER_PREFIX}-${year}-${String(n).padStart(6, "0")}`;
}
