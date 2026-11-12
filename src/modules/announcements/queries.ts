import "server-only";
import type { Member, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/rbac";

/** Announcements a given member is in the audience for. */
export function memberAnnouncementsWhere(member: Pick<Member, "status" | "tierId">): Prisma.AnnouncementWhereInput {
  return {
    sentAt: { not: null },
    OR: [
      { audience: "ALL" },
      ...(member.status === "ACTIVE" ? [{ audience: "ACTIVE" as const }] : []),
      { audience: "TIER", tierId: member.tierId },
    ],
  };
}

export function listAnnouncementsForMember(member: Pick<Member, "status" | "tierId">, take?: number) {
  return db.announcement.findMany({
    where: memberAnnouncementsWhere(member),
    orderBy: { sentAt: "desc" },
    take,
  });
}

export async function listAllAnnouncements() {
  await assertPermission("members.view");
  return db.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { tier: true, createdBy: { select: { name: true } } },
  });
}
