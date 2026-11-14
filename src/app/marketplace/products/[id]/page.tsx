import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { getProduct } from "../../_lib/products";
import { getUser } from "../../_lib/store";
import { buyAction } from "../../actions";
import { ProductIcon } from "../../_components/product-icon";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  const user = await getUser();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
        <ProductIcon icon={product.icon} className="size-24 text-muted-foreground" />
      </div>
      <div className="space-y-4">
        <Link href="/marketplace" className="text-sm text-muted-foreground underline">
          ← All products
        </Link>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="text-3xl font-bold">{formatMoney(product.price, product.currency)}</p>
        <p>{product.description}</p>
        <p className="text-sm text-muted-foreground">Sold by {product.seller}</p>
        {user ? (
          <form action={buyAction}>
            <input type="hidden" name="productId" value={product.id} />
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Buy now
            </Button>
          </form>
        ) : (
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={`/marketplace/login?next=/marketplace/products/${product.id}`}>Log in to buy</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
