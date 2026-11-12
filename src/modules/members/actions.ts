"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertMember, AuthError } from "@/lib/rbac";
import { fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { memberProfileSchema, type MemberProfileInput } from "./schemas";

/** Members edit their own contact details. Company name, RC number, tier and status are admin-only. */
export async function updateMemberProfileAction(input: MemberProfileInput): Promise<ActionResult> {
  let user;
  try {
    user = await assertMember();
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message);
    throw err;
  }
  const parsed = memberProfileSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const data = { ...parsed.data, website: parsed.data.website ?? null };
  const before = user.member;
  const changed = (Object.keys(data) as (keyof typeof data)[]).filter((k) => (before[k] ?? null) !== (data[k] ?? null));
  if (!changed.length) return { ok: true };

  await db.$transaction(async (tx) => {
    await tx.member.update({ where: { id: before.id }, data });
    if (data.repName !== before.repName) await tx.user.update({ where: { id: user.id }, data: { name: data.repName } });
    await audit({ actorId: user.id, action: "member.profile_updated", targetType: "Member", targetId: before.id, metadata: { fields: changed } }, tx);
  });

  revalidatePath("/member", "layout");
  return { ok: true };
}
