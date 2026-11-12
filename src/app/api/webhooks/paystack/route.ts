import { NextResponse, type NextRequest } from "next/server";
import { isValidWebhookSignature } from "@/lib/paystack";
import { fulfilPayment } from "@/modules/payments/service";

export const dynamic = "force-dynamic";

/**
 * Paystack webhook. Set in Paystack → Settings → API Keys & Webhooks:
 *   https://<main-domain>/api/webhooks/paystack
 * The signature is checked against the raw body, then the transaction is
 * re-verified with the Paystack API inside fulfilPayment (idempotent).
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!isValidWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const reference = event.data?.reference;
  if ((event.event === "charge.success" || event.event === "charge.failed") && reference) {
    try {
      const result = await fulfilPayment(reference, "webhook");
      return NextResponse.json({ received: true, outcome: result.outcome });
    } catch (err) {
      console.error("[webhook] paystack processing failed", err);
      // 500 makes Paystack retry later.
      return NextResponse.json({ error: "processing failed" }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true, ignored: event.event ?? null });
}
