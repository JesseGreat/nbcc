"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, FormError } from "@/components/form/field";
import { forgotPasswordAction, resetPasswordAction } from "../actions";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "../schemas";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  if (sent) {
    return (
      <div className="space-y-4 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
        <p>If an account exists for that email, we have sent a link to reset your password.</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const res = await forgotPasswordAction(values);
          if (res.ok) setSent(true);
          else setError(res.error);
        }),
      )}
    >
      <FormError message={error} />
      <Field id="email" label="Email" error={form.formState.errors.email?.message} required>
        <Input type="email" autoComplete="email" inputMode="email" {...form.register("email")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          const res = await resetPasswordAction(values);
          if (res.ok) window.location.assign(res.data.redirectTo);
          else setError(res.error);
        }),
      )}
    >
      <FormError message={error} />
      <Field
        id="password"
        label="New password"
        hint="At least 10 characters, with letters and numbers."
        error={form.formState.errors.password?.message}
        required
      >
        <PasswordInput autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field id="confirmPassword" label="Confirm new password" error={form.formState.errors.confirmPassword?.message} required>
        <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Save new password
      </Button>
    </form>
  );
}
