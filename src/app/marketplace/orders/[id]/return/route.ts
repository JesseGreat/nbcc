import { NextResponse, type NextRequest } from "next/server";
import { getOrder, getUser, setOrderStatus } from "../../../_lib/store";
import { verifyReference } from "../../../_lib/safebartter";

/**
 * returnTo target: SafeBartter sends the buyer back here with
 * ?status=success|cancelled|error&reference=...&reason=...
 * The status in the URL is untrusted (anyone can type it), so "success" is only
 * marked VERIFIED after the server-side verify call succeeds.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = request.nextUrl.searchParams;
  const status = q.get("status");
  const reference = q.get("reference")?.slice(0, 100) ?? null;
  const reason = q.get("reason");
  console.log("[marketplace] safebartter return", { orderId: id, status, reference, reason });

  const back = new URL(`/marketplace/orders/${id}`, request.url);
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL(`/marketplace/login?next=${back.pathname}`, request.url));
  const order = await getOrder(user.id, id);
  if (!order) return NextResponse.redirect(new URL("/marketplace/orders", request.url));
  if (["VERIFIED", "PAID"].includes(order.status)) return NextResponse.redirect(back);

  if (status === "success" && reference) {
    const verified = await verifyReference(reference);
    await setOrderStatus(order.id, verified?.ok ? "VERIFIED" : "PAID", reference);
  } else if (status === "cancelled") {
    await setOrderStatus(order.id, "PENDING", reference);
    back.searchParams.set("notice", "cancelled");
  } else {
    await setOrderStatus(order.id, "PENDING", reference);
    back.searchParams.set("notice", `error:${reason ?? "unknown"}`);
  }
  return NextResponse.redirect(back);
}
