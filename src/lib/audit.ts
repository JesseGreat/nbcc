import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient;

export type AuditEntry = {
  actorId: string | null;
  action: string;
  targetType: "Member" | "Payment" | "Announcement" | "Tier" | "Sector" | "User" | "Setting" | "System";
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/** Record an important action. Pass `tx` to write inside an existing transaction. */
export async function audit(entry: AuditEntry, tx: Tx = db) {
  await tx.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata,
    },
  });
}
