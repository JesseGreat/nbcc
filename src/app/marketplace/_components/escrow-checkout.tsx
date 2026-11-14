"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateOrderStatusAction } from "../actions";

type Order = { id: string; amount: number; currency: string; status: string; productName: string; seller: string };
type Buyer = { id: string; username: string };

/**
 * >>> ESCROW SDK GOES HERE <<<
 * Replace the body of `startEscrow` with the partner SDK call. Amount is in kobo (minor units).
 * When the SDK reports success, call updateOrderStatusAction with the escrow reference.
 */
async function startEscrow(order: Order, buyer: Buyer): Promise<{ reference: string }> {
  console.log("[marketplace] startEscrow", { order, buyer });
  // e.g. const res = await EscrowSDK.checkout({ amount: order.amount, currency: order.currency, reference: order.id, ... });
  return { reference: `TEST-${order.id.slice(0, 8)}` };
}

export function EscrowCheckout({ order, buyer }: { order: Order; buyer: Buyer }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(status: "IN_ESCROW" | "RELEASED" | "REFUNDED" | "DISPUTED", escrowRef?: string) {
    startTransition(async () => {
      setError(null);
      try {
        await updateOrderStatusAction({ orderId: order.id, status, escrowRef });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  async function pay() {
    setError(null);
    try {
      const { reference } = await startEscrow(order, buyer);
      update("IN_ESCROW", reference);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Escrow failed");
    }
  }

  return (
    <div className="space-y-3">
      {order.status === "PENDING" && (
        <Button size="lg" className="w-full" onClick={pay} disabled={pending}>
          Pay with escrow
        </Button>
      )}
      {order.status === "IN_ESCROW" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={() => update("RELEASED")} disabled={pending}>
            I received it: release funds
          </Button>
          <Button variant="outline" onClick={() => update("DISPUTED")} disabled={pending}>
            Raise a dispute
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
