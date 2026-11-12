import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { publicEnv, serverEnv } from "@/lib/env";

const API = "https://api.paystack.co";

/**
 * Mock mode for automated tests only (PAYSTACK_MOCK=true). It can never be
 * enabled in a production build, so it cannot be used to fake payments.
 */
export function isPaystackMock(): boolean {
  return process.env.PAYSTACK_MOCK === "true" && process.env.NODE_ENV !== "production";
}

export type PaystackTransaction = {
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "processing" | "queued" | "reversed";
  reference: string;
  amount: number;
  currency: string;
  channel: string | null;
  paid_at: string | null;
  gateway_response: string | null;
  customer?: { email?: string };
  [key: string]: unknown;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serverEnv.paystackSecretKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as { status: boolean; message: string; data: T } | null;
  if (!res.ok || !body?.status) {
    throw new Error(`Paystack ${path} failed: ${body?.message ?? res.statusText}`);
  }
  return body.data;
}

export async function initializeTransaction(input: {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorizationUrl: string; reference: string }> {
  if (isPaystackMock()) {
    const url = new URL(input.callbackUrl);
    url.searchParams.set("reference", input.reference);
    return { authorizationUrl: url.toString(), reference: input.reference };
  }
  const data = await call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  return { authorizationUrl: data.authorization_url, reference: data.reference };
}

/** Always verify server-to-server before trusting a payment. */
export async function verifyTransaction(
  reference: string,
  mockExpected?: { amountMinor: number; currency: string },
): Promise<PaystackTransaction> {
  if (isPaystackMock()) {
    return {
      status: "success",
      reference,
      amount: mockExpected?.amountMinor ?? 0,
      currency: mockExpected?.currency ?? "NGN",
      channel: "card",
      paid_at: new Date().toISOString(),
      gateway_response: "Approved (mock)",
    };
  }
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Webhook authenticity: HMAC-SHA512 of the raw body with the secret key. */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", serverEnv.paystackSecretKey).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function paymentCallbackUrl(): string {
  return `${publicEnv.appUrl}/member/payments/callback`;
}
