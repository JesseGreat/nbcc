/**
 * Role and permission definitions. Pure (no server imports) so middleware,
 * server code and UI can all share it. Enforcement happens in `rbac.ts`.
 */

export const ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "MEMBER"] as const;
export type AppRole = (typeof ROLES)[number];

export const ADMIN_ROLES: readonly AppRole[] = ["SUPER_ADMIN", "ADMIN", "STAFF"];

export function isAdminRole(role: string | null | undefined): role is AppRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

const PERMISSIONS = {
  "members.view": ["SUPER_ADMIN", "ADMIN", "STAFF"],
  "members.manage": ["SUPER_ADMIN", "ADMIN"],
  "applications.decide": ["SUPER_ADMIN", "ADMIN"],
  "payments.view": ["SUPER_ADMIN", "ADMIN", "STAFF"],
  "payments.export": ["SUPER_ADMIN", "ADMIN"],
  "announcements.send": ["SUPER_ADMIN", "ADMIN"],
  "renewals.remind": ["SUPER_ADMIN", "ADMIN", "STAFF"],
  "settings.manage": ["SUPER_ADMIN"],
  "demo.reset": ["SUPER_ADMIN"],
} as const satisfies Record<string, readonly AppRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: AppRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly AppRole[]).includes(role);
}

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  STAFF: "Staff",
  MEMBER: "Member",
};
