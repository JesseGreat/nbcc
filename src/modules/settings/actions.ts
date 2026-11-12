"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission, AuthError, type SessionUser } from "@/lib/rbac";
import { fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { createAdminClient } from "@/lib/supabase/server";
import { isDemoMode, publicEnv, serverEnv } from "@/lib/env";
import { toMinor } from "@/lib/money";
import { sendEmail } from "@/lib/email";
import { ROLE_LABELS, type Permission } from "@/lib/roles";
import { StaffInviteEmail } from "@/emails/templates";
import { confirmUrl } from "@/modules/auth/links";
import { runSeed } from "@/modules/demo/seed";
import {
  inviteStaffSchema,
  reminderSettingsSchema,
  sectorSchema,
  tierSchema,
  updateStaffSchema,
  type InviteStaffInput,
  type ReminderSettingsInput,
  type SectorInput,
  type TierInput,
  type UpdateStaffInput,
} from "./schemas";

async function guard(permission: Permission = "settings.manage"): Promise<SessionUser | null> {
  try {
    return await assertPermission(permission);
  } catch (err) {
    if (err instanceof AuthError) return null;
    throw err;
  }
}

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function done() {
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function saveTierAction(input: TierInput): Promise<ActionResult> {
  const user = await guard();
  if (!user) return fail("Only super admins can change settings.");
  const parsed = tierSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { id, name, description, feeMajor, isActive } = parsed.data;
  const data = { name, description: description || null, feeMinor: toMinor(feeMajor), isActive };

  try {
    if (id) {
      const before = await db.tier.findUnique({ where: { id } });
      if (!before) return fail("Tier not found.");
      await db.tier.update({ where: { id }, data });
      await audit({ actorId: user.id, action: "tier.updated", targetType: "Tier", targetId: id, metadata: { name, feeFrom: before.feeMinor, feeTo: data.feeMinor, isActive } });
    } else {
      const count = await db.tier.count();
      const tier = await db.tier.create({ data: { ...data, slug: slugify(name), sortOrder: count } });
      await audit({ actorId: user.id, action: "tier.created", targetType: "Tier", targetId: tier.id, metadata: { name, fee: data.feeMinor } });
    }
  } catch {
    return fail("A tier with that name already exists.");
  }
  return done();
}

export async function saveSectorAction(input: SectorInput): Promise<ActionResult> {
  const user = await guard();
  if (!user) return fail("Only super admins can change settings.");
  const parsed = sectorSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { id, name, isActive } = parsed.data;
  try {
    if (id) {
      await db.sector.update({ where: { id }, data: { name, isActive } });
      await audit({ actorId: user.id, action: "sector.updated", targetType: "Sector", targetId: id, metadata: { name, isActive } });
    } else {
      const count = await db.sector.count();
      const s = await db.sector.create({ data: { name, slug: slugify(name), isActive, sortOrder: count } });
      await audit({ actorId: user.id, action: "sector.created", targetType: "Sector", targetId: s.id, metadata: { name } });
    }
  } catch {
    return fail("A sector with that name already exists.");
  }
  return done();
}

export async function saveReminderSettingsAction(input: ReminderSettingsInput): Promise<ActionResult> {
  const user = await guard();
  if (!user) return fail("Only super admins can change settings.");
  const parsed = reminderSettingsSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  await db.setting.upsert({ where: { key: "reminders" }, update: { value: parsed.data }, create: { key: "reminders", value: parsed.data } });
  await audit({ actorId: user.id, action: "settings.reminders_updated", targetType: "Setting", targetId: "reminders", metadata: parsed.data });
  return done();
}

/** Invite a staff member: creates their auth account and emails a set-password link for the admin portal. */
export async function inviteStaffAction(input: InviteStaffInput): Promise<ActionResult> {
  const user = await guard();
  if (!user) return fail("Only super admins can manage staff.");
  const parsed = inviteStaffSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { name, email, role } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return fail("A user with that email already exists.");

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.generateLink({ type: "invite", email, options: { data: { name } } });
  if (error || !data.user || !data.properties) return fail(error?.message ?? "Could not create the account.");

  try {
    await supabase.auth.admin.updateUserById(data.user.id, { app_metadata: { role } });
    await db.user.create({ data: { id: data.user.id, email, name, role } });
  } catch (err) {
    await supabase.auth.admin.deleteUser(data.user.id).catch(() => {});
    throw err;
  }
  await audit({ actorId: user.id, action: "staff.invited", targetType: "User", targetId: data.user.id, metadata: { email, role } });

  const url = confirmUrl(publicEnv.adminUrl, data.properties.hashed_token, "invite", "/reset-password");
  await sendEmail({ to: email, subject: "You have been invited to the NBCC admin portal", react: StaffInviteEmail({ name, roleLabel: ROLE_LABELS[role].toLowerCase(), url }) });
  return done();
}

export async function updateStaffAction(input: UpdateStaffInput): Promise<ActionResult> {
  const user = await guard();
  if (!user) return fail("Only super admins can manage staff.");
  const parsed = updateStaffSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { userId, role, isDisabled } = parsed.data;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.role === "MEMBER") return fail("Staff user not found.");
  if (target.id === user.id && (role !== "SUPER_ADMIN" || isDisabled)) return fail("You cannot demote or disable your own account.");
  if (target.role === "SUPER_ADMIN" && (role !== "SUPER_ADMIN" || isDisabled)) {
    const others = await db.user.count({ where: { role: "SUPER_ADMIN", isDisabled: false, id: { not: target.id } } });
    if (others === 0) return fail("There must be at least one active super admin.");
  }

  await db.user.update({ where: { id: userId }, data: { role, isDisabled } });
  // Keep the JWT claim in sync; a ban stops a disabled user from signing in at all.
  await createAdminClient().auth.admin.updateUserById(userId, {
    app_metadata: { role },
    ban_duration: isDisabled ? "876000h" : "none",
  });
  await audit({ actorId: user.id, action: "staff.updated", targetType: "User", targetId: userId, metadata: { from: target.role, to: role, isDisabled } });
  return done();
}

/** DEMO_MODE only: wipe and re-seed all demo data. Staff accounts are kept. */
export async function resetDemoDataAction(): Promise<ActionResult> {
  if (!isDemoMode()) return fail("Demo reset is disabled.");
  const user = await guard("demo.reset");
  if (!user) return fail("Only super admins can reset demo data.");
  try {
    await runSeed({ db, supabase: createAdminClient(), demoPassword: serverEnv.demoPassword, reset: true, log: (m) => console.info(`[demo-reset] ${m}`) });
  } catch (err) {
    console.error("[demo-reset] failed", err);
    return fail("Reset failed. Check the server logs.");
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
