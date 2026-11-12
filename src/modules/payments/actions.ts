"use server";

import { db } from "@/lib/db";
import { assertMember, AuthError } from "@/lib/rbac";
import { fail, type ActionResult } from "@/lib/action-result";
import { initializeTransaction, paymentCallbackUrl } from "@/lib/paystack";
import { getPayState } from "@/modules/renewals/rules";
import { getReminderConfig } from "@/modules/settings/queries";
import { newPaymentReference } from "./service";

/**
 * Create a PENDING payment for the member's current tier fee and return the
 * Paystack checkout URL. The amount is always computed on the server.
 */
export async function startPaymentAction(): Promise<ActionResult<{ url: string }>> {
  let user;
  try {
    user = await assertMember();
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message);
    throw err;
  }
  const m = user.member;

  const [paidCount, cfg] = await Promise.all([db.payment.count({ where: { memberId: m.id, status: "SUCCESS" } }), getReminderConfig()]);
  const state = getPayState({ status: m.status, expiresAt: m.expiresAt, hasPaidBefore: paidCount > 0 }, cfg);
  if (!state.canPay) return fail(state.reason);

  const reference = newPaymentReference();
  const payment = await db.payment.create({
    data: {
      memberId: m.id,
      reference,
      amountMinor: m.tier.feeMinor,
      currency: m.tier.currency,
      status: "PENDING",
      purpose: state.purpose,
      tierName: m.tier.name,
    },
  });

  try {
    const { authorizationUrl } = await initializeTransaction({
      email: user.email,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      reference,
      callbackUrl: paymentCallbackUrl(),
      metadata: { paymentId: payment.id, memberId: m.id, membershipNumber: m.membershipNumber, purpose: state.purpose },
    });
    return { ok: true, data: { url: authorizationUrl } };
  } catch (err) {
    console.error("[payments] initialize failed", err);
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", rawGatewayResponse: { error: "initialize_failed" } } });
    return fail("We could not reach the payment provider. Please try again in a moment.");
  }
}
