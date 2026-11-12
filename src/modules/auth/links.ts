import "server-only";
import type { EmailOtpType } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { isAdminRole } from "@/lib/roles";

/** Admin sessions live on the admin subdomain (separate cookies), so links must point there. */
export function baseUrlForRole(role: string | null | undefined): string {
  return isAdminRole(role) ? publicEnv.adminUrl : publicEnv.appUrl;
}

/**
 * Link to our own /auth/confirm route with a hashed token from
 * `auth.admin.generateLink`. Works across devices (no PKCE verifier needed).
 */
export function confirmUrl(base: string, tokenHash: string, type: EmailOtpType, next: string): string {
  const url = new URL("/auth/confirm", base);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  url.searchParams.set("next", next);
  return url.toString();
}
