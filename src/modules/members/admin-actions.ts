"use server";

import { revalidatePath } from "next/cache";
import type { MemberStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission, AuthError } from "@/lib/rbac";
import { fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { nextMembershipNumber } from "@/lib/counters";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { ApprovedEmail, RejectedEmail } from "@/emails/templates";
import { approveSchema, changeTierSchema, rejectSchema, statusActionSchema, type StatusAction } from "./admin-schemas";

function revalidateMember(id: string) {
  revalidatePath("/admin/applications");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin");
}

async function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message);
    throw err;
  }
}

/**
 * Approve an application: assign the next membership number and notify the member.
 * The member becomes INACTIVE (approved, unpaid) and turns ACTIVE when the first fee is paid.
 */
export async function approveApplicationAction(input: { memberId: string }): Promise<ActionResult<{ membershipNumber: string }>> {
  return guard(async () => {
    const actor = await assertPermission("applications.decide");
    const parsed = approveSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    const result = await db.$transaction(async (tx) => {
      // Claim the application first (conditional update guards against two admins
      // approving at once); only then draw a number, so numbering has no gaps.
      const now = new Date();
      const { count } = await tx.member.updateMany({
        where: { id: parsed.data.memberId, status: "PENDING_APPROVAL" },
        data: { status: "INACTIVE", approvedAt: now, approvedById: actor.id, rejectionReason: null },
      });
      if (count === 0) return null;
      const membershipNumber = await nextMembershipNumber(tx, now);
      await tx.member.update({ where: { id: parsed.data.memberId }, data: { membershipNumber } });
      await audit({ actorId: actor.id, action: "application.approved", targetType: "Member", targetId: parsed.data.memberId, metadata: { membershipNumber } }, tx);
      return membershipNumber;
    });
    if (!result) return fail("This application is no longer pending approval.");

    const member = await db.member.findUniqueOrThrow({ where: { id: parsed.data.memberId }, include: { tier: true, user: true } });
    await sendEmail({
      to: member.user?.email ?? member.repEmail,
      subject: `Welcome to the NBCC — membership number ${result}`,
      react: ApprovedEmail({
        name: member.repName,
        companyName: member.companyName,
        membershipNumber: result,
        feeLabel: formatMoney(member.tier.feeMinor, member.tier.currency),
        url: `${publicEnv.appUrl}/member`,
      }),
    });

    revalidateMember(member.id);
    return { ok: true, data: { membershipNumber: result } };
  });
}

export async function rejectApplicationAction(input: { memberId: string; reason: string }): Promise<ActionResult> {
  return guard(async () => {
    const actor = await assertPermission("applications.decide");
    const parsed = rejectSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const { memberId, reason } = parsed.data;

    const { count } = await db.member.updateMany({
      where: { id: memberId, status: { in: ["PENDING_APPROVAL", "PENDING_VERIFICATION"] } },
      data: { status: "REJECTED", rejectionReason: reason },
    });
    if (count === 0) return fail("This application is no longer pending.");
    await audit({ actorId: actor.id, action: "application.rejected", targetType: "Member", targetId: memberId, metadata: { reason } });

    const member = await db.member.findUniqueOrThrow({ where: { id: memberId }, include: { user: true } });
    await sendEmail({
      to: member.user?.email ?? member.repEmail,
      subject: "An update on your NBCC membership application",
      react: RejectedEmail({ name: member.repName, companyName: member.companyName, reason }),
    });

    revalidateMember(memberId);
    return { ok: true };
  });
}

export async function changeTierAction(input: { memberId: string; tierId: string }): Promise<ActionResult> {
  return guard(async () => {
    const actor = await assertPermission("members.manage");
    const parsed = changeTierSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);

    const [member, tier] = await Promise.all([
      db.member.findUnique({ where: { id: parsed.data.memberId }, include: { tier: true } }),
      db.tier.findUnique({ where: { id: parsed.data.tierId } }),
    ]);
    if (!member || !tier) return fail("Member or tier not found.");
    if (member.tierId === tier.id) return { ok: true };

    await db.$transaction(async (tx) => {
      await tx.member.update({ where: { id: member.id }, data: { tierId: tier.id } });
      await audit({ actorId: actor.id, action: "member.tier_changed", targetType: "Member", targetId: member.id, metadata: { from: member.tier.name, to: tier.name } }, tx);
    });
    revalidateMember(member.id);
    return { ok: true };
  });
}

const ALLOWED_FROM: Record<StatusAction, MemberStatus[]> = {
  deactivate: ["ACTIVE"],
  archive: ["ACTIVE", "INACTIVE"],
  blacklist: ["ACTIVE", "INACTIVE", "ARCHIVED", "PENDING_APPROVAL", "REJECTED"],
  restore: ["INACTIVE", "ARCHIVED", "BLACKLISTED"],
};

export async function changeStatusAction(input: { memberId: string; action: StatusAction; reason?: string }): Promise<ActionResult> {
  return guard(async () => {
    const actor = await assertPermission("members.manage");
    const parsed = statusActionSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const { memberId, action, reason } = parsed.data;

    const member = await db.member.findUnique({ where: { id: memberId } });
    if (!member) return fail("Member not found.");
    if (!ALLOWED_FROM[action].includes(member.status)) return fail(`Cannot ${action} a member who is ${member.status.toLowerCase()}.`);

    let data: { status: MemberStatus; blacklistReason?: string | null };
    switch (action) {
      case "deactivate":
        data = { status: "INACTIVE" };
        break;
      case "archive":
        data = { status: "ARCHIVED" };
        break;
      case "blacklist":
        data = { status: "BLACKLISTED", blacklistReason: reason! };
        break;
      case "restore": {
        // Restored members are ACTIVE only if their paid period is still running.
        const paidUp = !!member.expiresAt && member.expiresAt > new Date();
        // Never-approved members (blacklisted while pending) go back to the queue.
        const status: MemberStatus = !member.membershipNumber ? "PENDING_APPROVAL" : paidUp ? "ACTIVE" : "INACTIVE";
        data = { status, blacklistReason: null };
        break;
      }
    }

    await db.$transaction(async (tx) => {
      await tx.member.update({ where: { id: memberId }, data });
      await audit({ actorId: actor.id, action: `member.${action}`, targetType: "Member", targetId: memberId, metadata: { from: member.status, to: data.status, ...(reason ? { reason } : {}) } }, tx);
    });
    revalidateMember(memberId);
    return { ok: true };
  });
}
