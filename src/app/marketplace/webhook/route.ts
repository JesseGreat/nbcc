import { NextResponse } from "next/server";
import { setOrderStatus } from "../_lib/store";
import { verifyReference } from "../_lib/safebartter";

/**
 * POST /marketplace/webhook — SafeBartter callbackUrl (checkout.session.completed).
 * Logs every payload. The payload itself isn't trusted (signature format unknown):
 * an order is only marked VERIFIED after the server-side verify call succeeds.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  console.log("[marketplace] safebartter webhook", { headers: Object.fromEntries(request.headers), body: raw });

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ received: true });
  }
  const data = (payload.data as Record<string, unknown> | undefined) ?? payload;
  const reference = typeof data.reference === "string" ? data.reference : null;
  const metadata = data.metadata as { orderId?: unknown } | undefined;
  const orderId = typeof metadata?.orderId === "string" ? metadata.orderId : null;

  if (reference && orderId) {
    const verified = await verifyReference(reference);
    if (verified?.ok) await setOrderStatus(orderId, "VERIFIED", reference);
  }
  return NextResponse.json({ received: true });
}
