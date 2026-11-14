import "server-only";
import { gzipSync } from "node:zlib";
import { headers } from "next/headers";
import type { Product } from "./products";

/**
 * SafeBartter escrow checkout (server-built link). Temporary, for the marketplace sandbox.
 *
 * Env:
 *  SAFEBARTTER_KEY           public key (sb_test_... while testing)            required
 *  SAFEBARTTER_SELLER_EMAIL  who gets paid; must differ from the buyer's email required
 *  SAFEBARTTER_CHECKOUT_URL  launcher, default the test launcher below
 *  SAFEBARTTER_API_URL       API base for GET /sdk/checkout/verify/{reference}  optional
 *  SAFEBARTTER_SECRET_KEY    secret key for verify                              optional
 */
const DEFAULT_CHECKOUT_URL = "https://pay-with-safebartter.vercel.app";

export function safebartterConfigError(): string | null {
  if (!process.env.SAFEBARTTER_KEY) return "SAFEBARTTER_KEY is not set";
  if (!process.env.SAFEBARTTER_SELLER_EMAIL) return "SAFEBARTTER_SELLER_EMAIL is not set";
  return null;
}

export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function checkoutUrl(order: { id: string }, product: Product): Promise<string> {
  const origin = await siteOrigin();
  const data = {
    key: process.env.SAFEBARTTER_KEY,
    sellerEmail: process.env.SAFEBARTTER_SELLER_EMAIL,
    product: {
      name: product.name,
      amount: product.price, // kobo
      quantity: 1,
      description: `${product.description} Sold by ${product.seller}.`,
      deliveryDays: product.deliveryDays,
      requiresPhysicalDelivery: product.requiresPhysicalDelivery,
      metadata: { productId: product.id },
    },
    feePayer: "buyer",
    callbackUrl: `${origin}/marketplace/webhook`,
    metadata: { orderId: order.id },
    returnTo: `${origin}/marketplace/orders/${order.id}/return`,
  };
  const d = gzipSync(JSON.stringify(data)).toString("base64url");
  const base = (process.env.SAFEBARTTER_CHECKOUT_URL ?? DEFAULT_CHECKOUT_URL).replace(/\/$/, "");
  return `${base}/?d=${d}`;
}

/** Server-side confirmation. Returns null when verify isn't configured yet. */
export async function verifyReference(reference: string): Promise<{ ok: boolean; body: unknown } | null> {
  const api = process.env.SAFEBARTTER_API_URL;
  const secret = process.env.SAFEBARTTER_SECRET_KEY;
  if (!api || !secret) return null;
  try {
    const res = await fetch(`${api.replace(/\/$/, "")}/sdk/checkout/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" },
      cache: "no-store",
    });
    const body: unknown = await res.json().catch(() => null);
    console.log("[marketplace] safebartter verify", reference, res.status, JSON.stringify(body));
    return { ok: res.ok, body };
  } catch (err) {
    console.error("[marketplace] safebartter verify failed", err);
    return { ok: false, body: null };
  }
}
