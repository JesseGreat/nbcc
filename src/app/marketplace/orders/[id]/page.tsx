import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { getProduct } from "../../_lib/products";
import { getOrder, getUser } from "../../_lib/store";
import { EscrowCheckout } from "../../_components/escrow-checkout";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/marketplace/login?next=/marketplace/orders/${id}`);
  const order = await getOrder(user.id, id);
  if (!order) notFound();
  const product = getProduct(order.product_id);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/marketplace/orders" className="text-sm text-muted-foreground underline">
        ← My orders
      </Link>
      <div className="rounded-lg border bg-background p-6">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Item" value={product?.name ?? order.product_id} />
          <Row label="Seller" value={product?.seller ?? "—"} />
          <Row label="Amount" value={formatMoney(Number(order.amount), "NGN")} />
          <Row label="Order ID" value={order.id} mono />
          <Row label="Status" value={order.status} />
          {order.escrow_ref && <Row label="Escrow ref" value={order.escrow_ref} mono />}
        </dl>
        <div className="mt-6">
          <EscrowCheckout
            order={{
              id: order.id,
              amount: Number(order.amount),
              currency: order.currency,
              status: order.status,
              productName: product?.name ?? order.product_id,
              seller: product?.seller ?? "",
            }}
            buyer={{ id: user.id, username: user.username }}
          />
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
