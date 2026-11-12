import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { ResetPasswordForm } from "@/modules/auth/components/password-forms";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reset password" };
export const dynamic = "force-dynamic";

/** Reached from the recovery email via /auth/confirm, which signs the user in first. */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=link_expired");

  return (
    <AuthCard title="Choose a new password" description={`For ${user.email}`}>
      <ResetPasswordForm />
    </AuthCard>
  );
}
