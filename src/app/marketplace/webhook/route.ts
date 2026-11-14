import { NextResponse } from "next/server";

/**
 * POST /marketplace/webhook — catch-all webhook URL to give the escrow provider.
 * For now it only logs the payload so you can see what they send. Add signature
 * verification and order updates once the SDK's webhook format is known.
 */
export async function POST(request: Request) {
  const body = await request.text();
  console.log("[marketplace] escrow webhook", {
    headers: Object.fromEntries(request.headers),
    body,
  });
  return NextResponse.json({ received: true });
}
