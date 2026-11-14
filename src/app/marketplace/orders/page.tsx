import Link from "next/link";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { getProduct } from "../_lib/products";
import { getUser, listOrders } from "../_lib/store";

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/marketplace/login?next=/marketplace/orders");
  const orders = await listOrders(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My orders</h1>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">
          No orders yet. <Link href="/marketplace" className="underline">Browse products</Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/marketplace/orders/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-4 hover:shadow-sm"
              >
                <span>
                  <span className="font-medium">{getProduct(o.product_id)?.name ?? o.product_id}</span>
                  <span className="block text-xs text-muted-foreground">{o.created_at.toLocaleString("en-GB")}</span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold">{formatMoney(Number(o.amount), "NGN")}</span>
                  <span className="text-xs">{o.status}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
