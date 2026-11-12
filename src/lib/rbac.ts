import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Member, Sector, Tier, User } from "@prisma/client";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { can, isAdminRole, type Permission } from "@/lib/roles";

export type SessionUser = User & {
  member: (Member & { tier: Tier; sector: Sector }) | null;
};

/**
 * The signed-in user, loaded from our database (the source of truth for roles).
 * Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  // Verified locally against the project's signing key (no Auth round trip).
  // Revocation is covered by the database check below (isDisabled) and short token lifetimes.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const appUser = await db.user.findUnique({
    where: { id: userId },
    include: { member: { include: { tier: true, sector: true } } },
  });
  if (!appUser || appUser.isDisabled) return null;
  return appUser;
});

export class AuthError extends Error {
  constructor(message = "You are not allowed to do that.") {
    super(message);
    this.name = "AuthError";
  }
}

/** For server actions: throws instead of redirecting. */
export async function assertPermission(permission: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !can(user.role, permission)) throw new AuthError();
  return user;
}

/** For server actions used by members on their own record. */
export async function assertMember(): Promise<SessionUser & { member: NonNullable<SessionUser["member"]> }> {
  const user = await getSessionUser();
  if (!user || user.role !== "MEMBER" || !user.member) throw new AuthError();
  return user as SessionUser & { member: NonNullable<SessionUser["member"]> };
}

/** For pages and layouts: redirects to login when signed out, or away when the role is wrong. */
export async function requireAdmin(permission?: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/login?error=not_admin");
  if (permission && !can(user.role, permission)) redirect("/?error=forbidden");
  return user;
}

export async function requireMember(): Promise<SessionUser & { member: NonNullable<SessionUser["member"]> }> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "MEMBER" || !user.member) redirect("/login?error=not_member");
  return user as SessionUser & { member: NonNullable<SessionUser["member"]> };
}
