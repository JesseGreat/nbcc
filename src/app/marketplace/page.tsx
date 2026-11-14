import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { PRODUCTS } from "./_lib/products";
import { ProductIcon } from "./_components/product-icon";

export default function MarketplacePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="text-sm text-muted-foreground">Test listings only. Nothing here is real.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <li key={p.id}>
            <Link
              href={`/marketplace/products/${p.id}`}
              className="block h-full rounded-lg border bg-background p-4 transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <div className="mb-3 flex aspect-[4/3] items-center justify-center rounded-md bg-muted">
                <ProductIcon icon={p.icon} className="size-14 text-muted-foreground" />
              </div>
              <h2 className="font-medium">{p.name}</h2>
              <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              <p className="mt-2 font-semibold">{formatMoney(p.price, p.currency)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
