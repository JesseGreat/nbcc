"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createOrder, createUser, getOrder, getUser, login, logout, setOrderStatus } from "./_lib/store";
import { getProduct } from "./_lib/products";

const credentials = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(32).regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, _ . - only"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export type AuthState = { error?: string };

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/marketplace") ? next : "/marketplace";
}

export async function signupAction(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({ username: form.get("username"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const result = await createUser(parsed.data.username, parsed.data.password);
  if (result === "taken") return { error: "That username is taken" };
  redirect(safeNext(form.get("next")));
}

export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({ username: form.get("username"), password: form.get("password") });
  if (!parsed.success) return { error: "Wrong username or password" };
  const ok = await login(parsed.data.username, parsed.data.password);
  if (!ok) return { error: "Wrong username or password" };
  redirect(safeNext(form.get("next")));
}

export async function logoutAction() {
  await logout();
  redirect("/marketplace");
}

export async function buyAction(form: FormData) {
  const productId = z.string().parse(form.get("productId"));
  const user = await getUser();
  if (!user) redirect(`/marketplace/login?next=/marketplace/products/${productId}`);
  const product = getProduct(productId);
  if (!product) redirect("/marketplace");
  const orderId = await createOrder(user.id, product.id, product.price, product.currency);
  redirect(`/marketplace/orders/${orderId}`);
}

const statusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["PENDING", "IN_ESCROW", "RELEASED", "REFUNDED", "DISPUTED", "CANCELLED"]),
  escrowRef: z.string().max(200).optional(),
});

/** Called from the checkout page after the escrow SDK reports back. */
export async function updateOrderStatusAction(input: z.infer<typeof statusSchema>) {
  const data = statusSchema.parse(input);
  const user = await getUser();
  if (!user) throw new Error("Not signed in");
  const order = await getOrder(user.id, data.orderId);
  if (!order) throw new Error("Order not found");
  await setOrderStatus(order.id, data.status, data.escrowRef);
}
