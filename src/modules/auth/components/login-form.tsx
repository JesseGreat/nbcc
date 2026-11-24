"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, FormError } from "@/components/form/field";
import { loginAction, resendVerificationAction } from "../actions";
import { loginSchema, type LoginInput } from "../schemas";

export type DemoAccount = { label: string; email: string; password: string };

export function LoginForm({
  next,
  initialError,
  demoAccounts,
  otherPortal,
}: {
  next?: string;
  initialError?: string | null;
  demoAccounts?: DemoAccount[];
  otherPortal?: { label: string; href: string };
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", next },
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    setErrorCode(null);
    startTransition(async () => {
      const res = await loginAction(values);
      if (res.ok) {
        // Full navigation so middleware routes it (admin subdomain rewrite).
        window.location.assign(res.data.redirectTo);
        return;
      }
      setError(res.error);
      setErrorCode(res.code ?? null);
    });
  });

  const resend = () =>
    startTransition(async () => {
      await resendVerificationAction({ email: form.getValues("email") });
      setResent(true);
    });

  return (
    <div className="space-y-6">
      {demoAccounts && demoAccounts.length > 0 && (
        <div className="rounded-xl border border-dashed border-brand-gold bg-accent/60 p-3">
          <p className="mb-2 text-xs font-semibold tracking-wide text-accent-foreground uppercase">Demo accounts</p>
          <div className="flex flex-wrap gap-2">
            {demoAccounts.map((a) => (
              <Button
                key={a.email}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("email", a.email, { shouldValidate: true });
                  form.setValue("password", a.password, { shouldValidate: true });
                }}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={error} />
        {errorCode === "email_not_confirmed" && (
          <p className="text-sm">
            {resent ? (
              "If an application is waiting for confirmation, we have sent a new link."
            ) : (
              <button type="button" onClick={resend} className="min-h-11 font-medium text-primary underline underline-offset-4">
                Resend confirmation email
              </button>
            )}
          </p>
        )}
        {otherPortal && (errorCode === "wrong_portal_admin" || errorCode === "wrong_portal_member") && (
          <p className="text-sm">
            <a href={otherPortal.href} className="font-medium text-primary underline underline-offset-4">
              {otherPortal.label}
            </a>
          </p>
        )}

        <Field id="email" label="Membership no / email" error={form.formState.errors.email?.message} required>
          <Input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="e.g. NBCC-2026-0001 / you@company.com" {...form.register("email")} />
        </Field>
        <Field id="password" label="Password" error={form.formState.errors.password?.message} required>
          <PasswordInput autoComplete="current-password" {...form.register("password")} />
        </Field>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Sign in
        </Button>
      </form>
    </div>
  );
}
