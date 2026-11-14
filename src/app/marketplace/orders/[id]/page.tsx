import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { getProduct } from "../../_lib/products";
import { getOrder, getUser } from "../../_lib/store";
import { checkoutUrl, safebartterConfigError } from "../../_lib/safebartter";

const STATUS_TEXT: Record<string, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid into escrow (not yet verified on the server)",
  VERIFIED: "Paid into escrow (verified with SafeBartter)",
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
  const user = await getUser();
  if (!user) redirect(`/marketplace/login?next=/marketplace/orders/${id}`);
  const order = await getOrder(user.id, id);
  if (!order) notFound();
  const product = getProduct(order.product_id);
  const configError = safebartterConfigError();
  const payUrl = product && !configError && order.status === "PENDING" ? await checkoutUrl(order, product) : null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/marketplace/orders" className="text-sm text-muted-foreground underline">
        ← My orders
      </Link>
      {notice && (
        <p role="status" className="rounded-md border bg-background p-3 text-sm">
          {notice === "cancelled" ? "Checkout was cancelled. You can try again." : `Checkout failed (${notice.replace("error:", "")}). You can try again.`}
        </p>
      )}
      <div className="rounded-lg border bg-background p-6">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Item" value={product?.name ?? order.product_id} />
          <Row label="Seller" value={product?.seller ?? "—"} />
          <Row label="Amount" value={formatMoney(Number(order.amount), "NGN")} />
          <Row label="Order ID" value={order.id} mono />
          <Row label="Status" value={STATUS_TEXT[order.status] ?? order.status} />
          {order.escrow_ref && <Row label="SafeBartter ref" value={order.escrow_ref} mono />}
        </dl>
        <div className="mt-6">
          {payUrl && (
            <Button asChild size="lg" className="w-full">
              <a href={payUrl}>Pay with SafeBartter escrow</a>
            </Button>
          )}
          {configError && order.status === "PENDING" && (
            <p className="text-sm text-destructive">Escrow not configured: {configError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs break-all text-right" : "text-right"}>{value}</dd>
    </div>
  );
}
