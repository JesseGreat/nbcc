import "server-only";
import type { PaymentStatus, Prisma } from "@prisma/client";
import { PaymentStatus as PaymentStatusEnum } from "@prisma/client";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/rbac";
import { PAGE_SIZE } from "@/lib/config";
import { addDays } from "@/lib/dates";

export type PaymentFilters = { q?: string; status?: string; from?: string; to?: string; page?: string };

function isStatus(v: string | undefined): v is PaymentStatus {
  return !!v && v in PaymentStatusEnum;
}

function parseDate(v: string | undefined): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00+01:00`); // Lagos midnight
  return Number.isNaN(d.getTime()) ? null : d;
}

export function paymentsWhere(f: PaymentFilters): Prisma.PaymentWhereInput {
  const from = parseDate(f.from);
  const to = parseDate(f.to);
  const q = f.q?.trim();
  return {
    ...(isStatus(f.status) ? { status: f.status } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: addDays(to, 1) } : {}) } } : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { receiptNumber: { contains: q, mode: "insensitive" } },
            { member: { companyName: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

export async function listPayments(f: PaymentFilters) {
  await assertPermission("payments.view");
  const page = Math.max(1, Number(f.page) || 1);
  const where = paymentsWhere(f);
  const [total, rows, sum] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { member: { select: { id: true, companyName: true, membershipNumber: true } } },
    }),
    db.payment.aggregate({ where: { ...where, status: "SUCCESS" }, _sum: { amountMinor: true } }),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), successTotalMinor: sum._sum.amountMinor ?? 0 };
}

/** Admin dashboard figures. Revenue is NGN only (the schema is GBP-ready; add a currency split when GBP is enabled). */
export async function getDashboardStats(now = new Date()) {
  await assertPermission("members.view");
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, -1)); // 1 Jan, Lagos midnight
  const in90 = addDays(now, 90);

  const [total, active, pending, expiring, archivedOrBlacklisted, revenueYear, byMonth, byTier] = await Promise.all([
    db.member.count({ where: { membershipNumber: { not: null } } }),
    db.member.count({ where: { status: "ACTIVE" } }),
    db.member.count({ where: { status: "PENDING_APPROVAL" } }),
    db.member.count({ where: { status: "ACTIVE", expiresAt: { gte: now, lte: in90 } } }),
    db.member.count({ where: { status: { in: ["ARCHIVED", "BLACKLISTED"] } } }),
    db.payment.aggregate({ where: { status: "SUCCESS", currency: "NGN", paidAt: { gte: yearStart } }, _sum: { amountMinor: true } }),
    db.$queryRaw<{ month: string; total: bigint }[]>`
      SELECT to_char(date_trunc('month', "paidAt" AT TIME ZONE 'Africa/Lagos'), 'YYYY-MM') AS month,
             SUM("amountMinor")::bigint AS total
      FROM "Payment"
      WHERE status = 'SUCCESS' AND currency = 'NGN'
        AND "paidAt" >= date_trunc('month', (now() AT TIME ZONE 'Africa/Lagos') - interval '11 months') AT TIME ZONE 'Africa/Lagos'
      GROUP BY 1 ORDER BY 1`,
    db.tier.findMany({
      orderBy: { sortOrder: "asc" },
      select: { name: true, _count: { select: { members: { where: { status: "ACTIVE" } } } } },
    }),
  ]);

  // Fill all 12 months so empty months show as zero rather than disappearing.
  const totals = new Map(byMonth.map((r) => [r.month, Number(r.total)]));
  const months: { month: string; label: string; revenueMinor: number }[] = [];
  const lagosNow = new Date(now.getTime() + 60 * 60 * 1000);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(lagosNow.getUTCFullYear(), lagosNow.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push({
      month: key,
      label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }),
      revenueMinor: totals.get(key) ?? 0,
    });
  }

  return {
    kpis: { total, active, pending, expiring, archivedOrBlacklisted, revenueYearMinor: revenueYear._sum.amountMinor ?? 0 },
    revenueByMonth: months,
    membersByTier: byTier.map((t) => ({ tier: t.name, members: t._count.members })),
  };
}
