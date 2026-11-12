import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/modules/auth/schemas";
import { onEmailVerified } from "@/modules/members/lifecycle";

const ALLOWED_TYPES: EmailOtpType[] = ["email", "signup", "magiclink", "recovery"];

/**
 * Handles links from our verification / password-reset emails:
 * /auth/confirm?token_hash=...&type=email|magiclink|recovery&next=/member
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"), "/member");

  const fail = (reason: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?error=${reason}`;
    return NextResponse.redirect(url);
  };

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) return fail("invalid_link");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error || !data.user) return fail("link_expired");

  if (type !== "recovery") await onEmailVerified(data.user.id);

  const url = request.nextUrl.clone();
  url.pathname = type === "recovery" ? "/reset-password" : next;
  url.search = "";
  return NextResponse.redirect(url);
}
