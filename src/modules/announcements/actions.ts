"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission, AuthError } from "@/lib/rbac";
import { fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { AnnouncementEmail } from "@/emails/templates";
import { announcementSchema, type AnnouncementInput } from "./schemas";

/** Who receives an announcement by email. Pending, rejected, archived and blacklisted members never do. */
function recipientWhere(input: Pick<AnnouncementInput, "audience" | "tierId">): Prisma.MemberWhereInput {
  switch (input.audience) {
    case "ACTIVE":
      return { status: "ACTIVE" };
    case "TIER":
      return { status: { in: ["ACTIVE", "INACTIVE"] }, tierId: input.tierId };
    default:
      return { status: { in: ["ACTIVE", "INACTIVE"] } };
  }
}

async function guard() {
  try {
    return await assertPermission("announcements.send");
  } catch (err) {
    if (err instanceof AuthError) return null;
    throw err;
  }
}

export async function countRecipientsAction(input: Pick<AnnouncementInput, "audience" | "tierId">): Promise<ActionResult<{ count: number }>> {
  if (!(await guard())) return fail("You are not allowed to do that.");
  const parsed = announcementSchema.innerType().pick({ audience: true, tierId: true }).safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  return { ok: true, data: { count: await db.member.count({ where: recipientWhere(parsed.data) }) } };
}

export async function sendAnnouncementAction(input: AnnouncementInput): Promise<ActionResult<{ sent: number; failed: number }>> {
  const user = await guard();
  if (!user) return fail("You are not allowed to do that.");
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const a = parsed.data;
  const tierId = a.audience === "TIER" ? a.tierId! : null;
  if (tierId && !(await db.tier.findUnique({ where: { id: tierId } }))) return fail("Tier not found.");

  const members = await db.member.findMany({ where: recipientWhere(a), select: { repEmail: true, user: { select: { email: true } } } });
  const emails = [...new Set(members.map((m) => (m.user?.email ?? m.repEmail).toLowerCase()))];

  const announcement = await db.announcement.create({
    data: { title: a.title, body: a.body, audience: a.audience, tierId, createdById: user.id, recipientCount: emails.length, sentAt: new Date() },
  });

  // Sent in small parallel batches. TODO(scale): move to a queue / Resend batch API for thousands of members.
  let sent = 0;
  let failed = 0;
  const react = AnnouncementEmail({ title: a.title, body: a.body, url: `${publicEnv.appUrl}/member/announcements` });
  for (let i = 0; i < emails.length; i += 5) {
    const results = await Promise.all(emails.slice(i, i + 5).map((to) => sendEmail({ to, subject: a.title, react })));
    results.forEach((r) => (r.ok ? sent++ : failed++));
  }

  await audit({ actorId: user.id, action: "announcement.sent", targetType: "Announcement", targetId: announcement.id, metadata: { audience: a.audience, recipients: emails.length, failed } });
  revalidatePath("/admin/announcements");
  revalidatePath("/member", "layout");
  return { ok: true, data: { sent, failed } };
}
