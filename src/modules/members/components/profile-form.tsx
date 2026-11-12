"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/form/field";
import { updateMemberProfileAction } from "../actions";
import { memberProfileSchema, type MemberProfileInput } from "../schemas";

export function ProfileForm({ defaults }: { defaults: MemberProfileInput }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<MemberProfileInput>({ resolver: zodResolver(memberProfileSchema), defaultValues: defaults });
  const e = form.formState.errors;

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setError(null);
          const res = await updateMemberProfileAction(values);
          if (res.ok) {
            toast.success("Profile updated.");
            form.reset(values);
          } else setError(res.error);
        }),
      )}
    >
      <FormError message={error} />
      <Field id="website" label="Website" error={e.website?.message}>
        <Input type="url" inputMode="url" autoComplete="url" {...form.register("website")} />
      </Field>
      <Field id="address" label="Address" error={e.address?.message} required>
        <Textarea rows={3} autoComplete="street-address" {...form.register("address")} />
      </Field>

      <h3 className="mt-2 font-semibold">Managing Director</h3>
      <Field id="mdName" label="Name" error={e.mdName?.message} required>
        <Input {...form.register("mdName")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="mdEmail" label="Email" error={e.mdEmail?.message} required>
          <Input type="email" inputMode="email" {...form.register("mdEmail")} />
        </Field>
        <Field id="mdPhone" label="Phone" error={e.mdPhone?.message} required>
          <Input type="tel" inputMode="tel" {...form.register("mdPhone")} />
        </Field>
      </div>

      <h3 className="mt-2 font-semibold">Representative (you)</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="repName" label="Name" error={e.repName?.message} required>
          <Input autoComplete="name" {...form.register("repName")} />
        </Field>
        <Field id="repPhone" label="Phone" error={e.repPhone?.message} required>
          <Input type="tel" inputMode="tel" autoComplete="tel" {...form.register("repPhone")} />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending || !form.formState.isDirty} className="w-full sm:w-auto">
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
