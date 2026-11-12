import "server-only";
import type { MemberStatus, Prisma } from "@prisma/client";
import { MemberStatus as MemberStatusEnum } from "@prisma/client";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/rbac";
import { PAGE_SIZE } from "@/lib/config";

export type MemberListFilters = {
  q?: string;
  status?: string;
  tierId?: string;
  sectorId?: string;
  page?: string;
};

function isStatus(v: string | undefined): v is MemberStatus {
  return !!v && v in MemberStatusEnum;
}

export async function listMembers(filters: MemberListFilters) {
  await assertPermission("members.view");
  const page = Math.max(1, Number(filters.page) || 1);
  const q = filters.q?.trim();

  const where: Prisma.MemberWhereInput = {
    ...(isStatus(filters.status) ? { status: filters.status } : {}),
    ...(filters.tierId ? { tierId: filters.tierId } : {}),
    ...(filters.sectorId ? { sectorId: filters.sectorId } : {}),
    ...(q
      ? {
          OR: [
            { companyName: { contains: q, mode: "insensitive" } },
            { membershipNumber: { contains: q, mode: "insensitive" } },
            { repEmail: { contains: q, mode: "insensitive" } },
            { rcNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    db.member.count({ where }),
    db.member.findMany({
      where,
      orderBy: [{ companyName: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { tier: true, sector: true },
    }),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function listApplications() {
  await assertPermission("members.view");
  return db.member.findMany({
    where: { status: { in: ["PENDING_APPROVAL", "PENDING_VERIFICATION"] } },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: { tier: true, sector: true, _count: { select: { documents: true } } },
  });
}

export async function countPendingApplications() {
  return db.member.count({ where: { status: "PENDING_APPROVAL" } });
}

export async function getMemberDetail(id: string) {
  await assertPermission("members.view");
  return db.member.findUnique({
    where: { id },
    include: {
      tier: true,
      sector: true,
      approvedBy: { select: { name: true } },
      documents: { orderBy: { uploadedAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, email: true, lastLoginAt: true } },
      reminders: { orderBy: { sentAt: "desc" }, take: 10 },
    },
  });
}

export async function getMemberAuditTrail(memberId: string) {
  await assertPermission("members.view");
  const paymentIds = (await db.payment.findMany({ where: { memberId }, select: { id: true } })).map((p) => p.id);
  return db.auditLog.findMany({
    where: {
      OR: [
        { targetType: "Member", targetId: memberId },
        ...(paymentIds.length ? [{ targetType: "Payment", targetId: { in: paymentIds } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { name: true } } },
  });
}
