import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { can } from "@/lib/roles";
import { renderReceiptPdf } from "@/modules/payments/receipt-pdf";

export const dynamic = "force-dynamic";

/** PDF receipt. Only the owning member or staff with payments.view may download. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ paymentId: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { paymentId } = await params;
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { member: true } });

  const allowed = payment && (can(user.role, "payments.view") || (user.role === "MEMBER" && user.memberId === payment.memberId));
  // 404 rather than 403 so receipt ids cannot be probed.
  if (!payment || !allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payment.status !== "SUCCESS" || !payment.receiptNumber) {
    return NextResponse.json({ error: "No receipt for this payment" }, { status: 404 });
  }

  const pdf = await renderReceiptPdf(payment, payment.member);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${payment.receiptNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
