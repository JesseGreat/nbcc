import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUser, AuthError } from "@/lib/rbac";
import { PAGE_SIZE } from "@/lib/config";

export type DirectoryFilters = { q?: string; sectorId?: string; tierId?: string; page?: string };

/** ACTIVE members only. Available to signed-in active members and staff. */
export async function listDirectory(filters: DirectoryFilters) {
  const user = await getSessionUser();
  const allowed = user && (user.role !== "MEMBER" || user.member?.status === "ACTIVE");
  if (!allowed) throw new AuthError();

  const page = Math.max(1, Number(filters.page) || 1);
  const q = filters.q?.trim();
  const where: Prisma.MemberWhereInput = {
    status: "ACTIVE",
    ...(filters.sectorId ? { sectorId: filters.sectorId } : {}),
    ...(filters.tierId ? { tierId: filters.tierId } : {}),
    ...(q ? { companyName: { contains: q, mode: "insensitive" } } : {}),
  };

  const [total, rows] = await Promise.all([
    db.member.count({ where }),
    db.member.findMany({
      where,
      orderBy: { companyName: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      // Only public directory fields; never contact details or documents.
      select: {
        id: true,
        companyName: true,
        website: true,
        logoPath: true,
        sector: { select: { name: true } },
        tier: { select: { name: true } },
      },
    }),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
