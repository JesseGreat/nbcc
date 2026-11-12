import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { nextReceiptNumber } from "@/lib/counters";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { verifyTransaction } from "@/lib/paystack";
import { PaymentReceiptEmail } from "@/emails/templates";
import { computePeriod } from "@/modules/renewals/rules";
import { renderReceiptPdf } from "./receipt-pdf";

export function newPaymentReference(): string {
  return `NBCC-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export type FulfilResult =
  | { outcome: "success"; paymentId: string }
  | { outcome: "already_processed"; paymentId: string; status: string }
  | { outcome: "failed"; paymentId: string; reason: string }
  | { outcome: "pending"; paymentId: string }
  | { outcome: "not_found" };

/**
 * Verify a payment with Paystack and, if successful, activate the membership.
 * Idempotent by reference: the callback and the webhook may both call this,
 * concurrently or repeatedly; only the first successful call changes anything
 * and sends the receipt.
 */
export async function fulfilPayment(reference: string, source: "callback" | "webhook"): Promise<FulfilResult> {
  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment) return { outcome: "not_found" };
  if (payment.status !== "PENDING") return { outcome: "already_processed", paymentId: payment.id, status: payment.status };

  const tx = await verifyTransaction(reference, { amountMinor: payment.amountMinor, currency: payment.currency });
  const raw = JSON.parse(JSON.stringify(tx)) as Prisma.InputJsonValue;

  if (tx.status !== "success") {
    if (tx.status === "failed" || tx.status === "reversed") {
      const { count } = await db.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "FAILED", rawGatewayResponse: raw, channel: tx.channel },
      });
      if (count) await audit({ actorId: null, action: "payment.failed", targetType: "Payment", targetId: payment.id, metadata: { reference, source, gateway: tx.gateway_response } });
      return { outcome: "failed", paymentId: payment.id, reason: tx.gateway_response ?? "Payment failed" };
    }
    return { outcome: "pending", paymentId: payment.id };
  }

  // Never trust the amount from the client: it must match what we asked for.
  if (tx.amount !== payment.amountMinor || tx.currency !== payment.currency) {
    await db.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED", rawGatewayResponse: raw } });
    await audit({ actorId: null, action: "payment.amount_mismatch", targetType: "Payment", targetId: payment.id, metadata: { expected: payment.amountMinor, got: tx.amount, currency: tx.currency } });
    return { outcome: "failed", paymentId: payment.id, reason: "Amount mismatch. Please contact the Chamber." };
  }

  const paidAt = tx.paid_at ? new Date(tx.paid_at) : new Date();

  const done = await db.$transaction(async (t) => {
    // Claim the payment; a concurrent call blocks on the row lock, then sees 0 rows.
    const { count } = await t.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "SUCCESS", paidAt, channel: tx.channel, rawGatewayResponse: raw },
    });
    if (count === 0) return null;

    const member = await t.member.findUniqueOrThrow({ where: { id: payment.memberId } });
    const { periodStart, periodEnd } = computePeriod(member, paidAt);
    const receiptNumber = await nextReceiptNumber(t, paidAt);
    await t.payment.update({ where: { id: payment.id }, data: { receiptNumber, periodStart, periodEnd } });

    // Only lapsed / unpaid / active members are (re)activated by paying.
    const activatable = ["ACTIVE", "INACTIVE", "ARCHIVED"].includes(member.status);
    if (activatable) {
      await t.member.update({ where: { id: member.id }, data: { status: "ACTIVE", expiresAt: periodEnd } });
    }
    await audit(
      {
        actorId: null,
        action: "payment.succeeded",
        targetType: "Payment",
        targetId: payment.id,
        metadata: { reference, receiptNumber, source, memberId: member.id, activated: activatable, from: member.status, to: activatable ? "ACTIVE" : member.status },
      },
      t,
    );
    return { receiptNumber };
  });

  if (!done) return { outcome: "already_processed", paymentId: payment.id, status: "SUCCESS" };

  await sendReceiptEmail(payment.id);
  return { outcome: "success", paymentId: payment.id };
}

async function sendReceiptEmail(paymentId: string) {
  try {
    const p = await db.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { member: { include: { user: true } } } });
    const pdf = await renderReceiptPdf(p, p.member);
    await sendEmail({
      to: p.member.user?.email ?? p.member.repEmail,
      subject: `Payment received — receipt ${p.receiptNumber}`,
      react: PaymentReceiptEmail({
        name: p.member.repName,
        companyName: p.member.companyName,
        receiptNumber: p.receiptNumber!,
        amountLabel: formatMoney(p.amountMinor, p.currency),
        periodLabel: `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`,
        reference: p.reference,
        url: `${publicEnv.appUrl}/member/payments`,
      }),
      attachments: [{ filename: `${p.receiptNumber}.pdf`, content: pdf }],
    });
  } catch (err) {
    // The payment is recorded; a missing email must not undo it.
    console.error("[payments] receipt email failed", err);
  }
}
