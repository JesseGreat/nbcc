import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getSessionUser } from "@/lib/rbac";
import { can } from "@/lib/roles";
import { paymentsWhere, type PaymentFilters } from "@/modules/payments/queries";

export const dynamic = "force-dynamic";

/** Quote a CSV cell and neutralise spreadsheet formula injection (=, +, -, @). */
function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "payments.export")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filters = Object.fromEntries(request.nextUrl.searchParams) as PaymentFilters;
  const rows = await db.payment.findMany({
    where: paymentsWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 10_000,
    include: { member: { select: { companyName: true, membershipNumber: true } } },
  });

  const header = ["Date", "Company", "Membership number", "Tier", "Type", "Status", "Amount", "Currency", "Channel", "Receipt number", "Reference", "Period start", "Period end"];
  const lines = rows.map((p) =>
    [
      (p.paidAt ?? p.createdAt).toISOString(),
      p.member.companyName,
      p.member.membershipNumber,
      p.tierName,
      p.purpose,
      p.status,
      (p.amountMinor / 100).toFixed(2),
      p.currency,
      p.channel,
      p.receiptNumber,
      p.reference,
      p.periodStart?.toISOString().slice(0, 10),
      p.periodEnd?.toISOString().slice(0, 10),
    ]
      .map(cell)
      .join(","),
  );

  await audit({ actorId: user.id, action: "payments.exported", targetType: "System", metadata: { rows: rows.length, filters } });

  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nbcc-payments-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
