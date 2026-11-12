"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission, AuthError } from "@/lib/rbac";
import { fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { sendRenewalReminder } from "./service";

const oneSchema = z.object({ memberId: z.string().min(1).max(40) });
const bulkSchema = z.object({ memberIds: z.array(z.string().min(1).max(40)).min(1).max(500) });

async function actor() {
  try {
    return await assertPermission("renewals.remind");
  } catch (err) {
    if (err instanceof AuthError) return null;
    throw err;
  }
}

export async function sendReminderAction(input: { memberId: string }): Promise<ActionResult> {
  const user = await actor();
  if (!user) return fail("You are not allowed to do that.");
  const parsed = oneSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const m = await db.member.findUnique({ where: { id: parsed.data.memberId }, include: { tier: true, user: true } });
  if (!m || !["ACTIVE", "INACTIVE"].includes(m.status)) return fail("This member cannot receive renewal reminders.");
  const r = await sendRenewalReminder(m, "manual", user.id);
  if (!r.ok) return fail(`Email failed: ${r.error}`);
  revalidatePath("/admin/renewals");
  return { ok: true };
}

export async function sendBulkRemindersAction(input: { memberIds: string[] }): Promise<ActionResult<{ sent: number; failed: number }>> {
  const user = await actor();
  if (!user) return fail("You are not allowed to do that.");
  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const members = await db.member.findMany({
    where: { id: { in: parsed.data.memberIds }, status: { in: ["ACTIVE", "INACTIVE"] }, expiresAt: { not: null } },
    include: { tier: true, user: true },
  });
  let sent = 0;
  let failed = 0;
  for (const m of members) {
    const r = await sendRenewalReminder(m, "manual", user.id);
    if (r.ok) sent++;
    else failed++;
  }
  revalidatePath("/admin/renewals");
  return { ok: true, data: { sent, failed } };
}
