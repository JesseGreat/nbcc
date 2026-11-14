import "server-only";
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * TEMPORARY marketplace sandbox for testing a partner's escrow SDK. NOT part of the NBCC portal.
 * Uses its own tables (mp_users, mp_orders) created on first use with raw SQL, so the Prisma
 * schema and migrations are untouched. To remove: delete src/app/marketplace and run
 *   DROP TABLE IF EXISTS mp_orders, mp_users;
 */

export const SESSION_COOKIE = "mp_session";

export type MpUser = { id: string; username: string };
export type MpOrder = {
  id: string;
  user_id: string;
  product_id: string;
  amount: bigint | number;
  currency: string;
  status: string;
  escrow_ref: string | null;
  created_at: Date;
};

let ready: Promise<void> | null = null;

function ensureTables(): Promise<void> {
  ready ??= (async () => {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS mp_users (
      id text PRIMARY KEY,
      username text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      session_token text UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS mp_orders (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES mp_users(id) ON DELETE CASCADE,
      product_id text NOT NULL,
      amount bigint NOT NULL,
      currency text NOT NULL DEFAULT 'NGN',
      status text NOT NULL DEFAULT 'PENDING',
      escrow_ref text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    // Keep these out of Supabase's public REST API, like every other table.
    await db.$executeRawUnsafe(`ALTER TABLE mp_users ENABLE ROW LEVEL SECURITY`);
    await db.$executeRawUnsafe(`ALTER TABLE mp_orders ENABLE ROW LEVEL SECURITY`);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function checkPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await db.$executeRaw`UPDATE mp_users SET session_token = ${token} WHERE id = ${userId}`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/marketplace",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function createUser(username: string, password: string): Promise<"taken" | "ok"> {
  await ensureTables();
  const existing = await db.$queryRaw<{ id: string }[]>`SELECT id FROM mp_users WHERE username = ${username}`;
  if (existing.length) return "taken";
  const id = randomUUID();
  await db.$executeRaw`INSERT INTO mp_users (id, username, password_hash) VALUES (${id}, ${username}, ${hashPassword(password)})`;
  await startSession(id);
  return "ok";
}

export async function login(username: string, password: string): Promise<boolean> {
  await ensureTables();
  const rows = await db.$queryRaw<{ id: string; password_hash: string }[]>`
    SELECT id, password_hash FROM mp_users WHERE username = ${username}`;
  const user = rows[0];
  if (!user || !checkPassword(password, user.password_hash)) return false;
  await startSession(user.id);
  return true;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await ensureTables();
    await db.$executeRaw`UPDATE mp_users SET session_token = NULL WHERE session_token = ${token}`;
  }
  jar.delete({ name: SESSION_COOKIE, path: "/marketplace" });
}

export async function getUser(): Promise<MpUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await ensureTables();
  const rows = await db.$queryRaw<MpUser[]>`SELECT id, username FROM mp_users WHERE session_token = ${token}`;
  return rows[0] ?? null;
}

export async function createOrder(userId: string, productId: string, amount: number, currency: string) {
  await ensureTables();
  const id = randomUUID();
  await db.$executeRaw`INSERT INTO mp_orders (id, user_id, product_id, amount, currency)
    VALUES (${id}, ${userId}, ${productId}, ${amount}, ${currency})`;
  return id;
}

export async function listOrders(userId: string): Promise<MpOrder[]> {
  await ensureTables();
  return db.$queryRaw<MpOrder[]>`SELECT * FROM mp_orders WHERE user_id = ${userId} ORDER BY created_at DESC`;
}

export async function getOrder(userId: string, orderId: string): Promise<MpOrder | null> {
  await ensureTables();
  const rows = await db.$queryRaw<MpOrder[]>`SELECT * FROM mp_orders WHERE id = ${orderId} AND user_id = ${userId}`;
  return rows[0] ?? null;
}

export async function setOrderStatus(orderId: string, status: string, escrowRef?: string | null) {
  await ensureTables();
  await db.$executeRaw`UPDATE mp_orders
    SET status = ${status}, escrow_ref = COALESCE(${escrowRef ?? null}, escrow_ref), updated_at = now()
    WHERE id = ${orderId}`;
}
