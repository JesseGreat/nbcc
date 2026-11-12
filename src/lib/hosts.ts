/**
 * Host helpers shared by middleware (edge) and server code.
 * The admin area is served on `admin.<domain>`; the member portal on the main domain.
 */

const ADMIN_PREFIX = "admin.";

export function isAdminHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const configured = safeHost(process.env.NEXT_PUBLIC_ADMIN_URL);
  if (configured && host === configured) return true;
  return host.startsWith(ADMIN_PREFIX);
}

function safeHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** Paths on the admin host that are served as-is instead of rewritten into /admin. */
export const ADMIN_HOST_PASSTHROUGH = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/api",
];

export function isPassthroughPath(pathname: string): boolean {
  return ADMIN_HOST_PASSTHROUGH.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
