"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { fail, fromZodError, type ActionResult } from "@/lib/action-result";
import { isAdminHost } from "@/lib/hosts";
import { isAdminRole } from "@/lib/roles";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { PasswordResetEmail, VerifyEmail } from "@/emails/templates";
import { baseUrlForRole, confirmUrl } from "./links";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  safeNextPath,
  type ForgotPasswordInput,
  type LoginInput,
  type ResetPasswordInput,
} from "./schemas";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { email, password, next } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return fail("Please confirm your email address first. Check your inbox for the link.", "email_not_confirmed");
    }
    return fail("Incorrect email or password.");
  }

  const appUser = await db.user.findUnique({ where: { id: data.user.id } });
  if (!appUser || appUser.isDisabled) {
    await supabase.auth.signOut();
    return fail("This account is not active. Please contact the Chamber.");
  }

  const onAdminHost = isAdminHost((await headers()).get("host"));
  const admin = isAdminRole(appUser.role);

  if (onAdminHost && !admin) {
    await supabase.auth.signOut();
    return fail("This portal is for Chamber staff. Members sign in on the member portal.", "wrong_portal_member");
  }
  if (!onAdminHost && admin) {
    await supabase.auth.signOut();
    return fail("Staff accounts sign in on the admin portal.", "wrong_portal_admin");
  }

  // Keep the JWT role claim (read by middleware) in sync with the database.
  if (data.user.app_metadata?.role !== appUser.role) {
    await createAdminClient().auth.admin.updateUserById(appUser.id, { app_metadata: { role: appUser.role } });
    await supabase.auth.refreshSession();
  }
  await db.user.update({ where: { id: appUser.id }, data: { lastLoginAt: new Date() } });

  redirect(safeNextPath(next, admin ? "/" : "/member"));
}

/** Always reports success so the form cannot be used to discover registered emails. */
export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user && !user.isDisabled) {
    const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "recovery", email: user.email });
    if (!error && data.properties) {
      const url = confirmUrl(baseUrlForRole(user.role), data.properties.hashed_token, "recovery", "/reset-password");
      await sendEmail({ to: user.email, subject: "Reset your NBCC portal password", react: PasswordResetEmail({ name: user.name, url }) });
    } else if (error) {
      console.error("[auth] recovery link failed", error.message);
    }
  }
  return { ok: true };
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Your reset link has expired. Please request a new one.");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(error.message);

  const appUser = await db.user.findUnique({ where: { id: user.id } });
  redirect(isAdminRole(appUser?.role) ? "/" : "/member");
}

/** Re-send the email verification link. Generic response either way. */
export async function resendVerificationAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const user = await db.user.findUnique({ where: { email: parsed.data.email }, include: { member: true } });
  if (user?.member?.status === "PENDING_VERIFICATION") {
    // A magic link confirms the email address of an unconfirmed user when used.
    const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "magiclink", email: user.email });
    if (!error && data.properties) {
      const url = confirmUrl(publicEnv.appUrl, data.properties.hashed_token, "magiclink", "/member");
      await sendEmail({ to: user.email, subject: "Confirm your email address", react: VerifyEmail({ name: user.name, url }) });
    }
  }
  return { ok: true };
}
