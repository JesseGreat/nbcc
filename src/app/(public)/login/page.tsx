import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { LoginForm, type DemoAccount } from "@/modules/auth/components/login-form";
import { isAdminHost } from "@/lib/hosts";
import { isDemoMode, publicEnv, serverEnv } from "@/lib/env";
import { DEMO_ACCOUNTS } from "@/modules/demo/accounts";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  not_admin: "That account does not have access to the admin portal.",
  not_member: "Please sign in with a member account.",
  link_expired: "That link has expired or was already used. Please sign in or request a new link.",
  invalid_link: "That link is not valid.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const admin = isAdminHost((await headers()).get("host"));

  // Demo mode only: quick-fill buttons for the demo logins.
  let demoAccounts: DemoAccount[] | undefined;
  const demoPassword = serverEnv.demoPassword;
  if (isDemoMode() && demoPassword) {
    demoAccounts = admin
      ? [
          { label: "Super admin", email: DEMO_ACCOUNTS.admin.email, password: demoPassword },
          { label: "Staff", email: DEMO_ACCOUNTS.staff.email, password: demoPassword },
        ]
      : [{ label: "Active member", email: DEMO_ACCOUNTS.member.email, password: demoPassword }];
  }

  return (
    <AuthCard
      title={admin ? "Admin sign in" : "Member sign in"}
      description={admin ? "For Chamber staff only." : "Sign in to manage your Chamber membership."}
    >
      <LoginForm
        next={params.next}
        initialError={params.error ? ERRORS[params.error] : null}
        demoAccounts={demoAccounts}
        otherPortal={
          admin
            ? { label: "Go to the member portal →", href: `${publicEnv.appUrl}/login` }
            : { label: "Go to the admin portal →", href: `${publicEnv.adminUrl}/login` }
        }
      />
      {!admin && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not a member yet?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Apply for membership
          </Link>
        </p>
      )}
    </AuthCard>
  );
}
