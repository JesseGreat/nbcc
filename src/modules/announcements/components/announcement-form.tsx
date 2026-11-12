"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/form/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { countRecipientsAction, sendAnnouncementAction } from "../actions";
import { announcementSchema, AUDIENCE_LABELS, type AnnouncementInput } from "../schemas";

export function AnnouncementForm({ tiers }: { tiers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<AnnouncementInput | null>(null);

  const form = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", body: "", audience: "ACTIVE", tierId: "" },
  });
  const [title, body, audience, tierId] = form.watch(["title", "body", "audience", "tierId"]);
  const e = form.formState.errors;

  useEffect(() => {
    if (audience === "TIER" && !tierId) return setRecipients(null);
    let cancelled = false;
    countRecipientsAction({ audience, tierId: tierId || undefined }).then((r) => {
      if (!cancelled && r.ok) setRecipients(r.data.count);
    });
    return () => {
      cancelled = true;
    };
  }, [audience, tierId]);

  const send = (values: AnnouncementInput) =>
    startTransition(async () => {
      setError(null);
      const res = await sendAnnouncementAction({ ...values, tierId: values.tierId || undefined });
      setConfirm(null);
      if (!res.ok) return setError(res.error);
      toast.success(`Announcement sent to ${res.data.sent} member${res.data.sent === 1 ? "" : "s"}${res.data.failed ? ` (${res.data.failed} failed)` : ""}.`);
      router.push("/announcements");
      router.refresh();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form noValidate className="grid content-start gap-4" onSubmit={form.handleSubmit((v) => setConfirm(v))}>
        <FormError message={error} />
        <Field id="title" label="Title" error={e.title?.message} required>
          <Input {...form.register("title")} />
        </Field>
        <Field id="body" label="Message" hint="Separate paragraphs with a blank line." error={e.body?.message} required>
          <Textarea rows={10} {...form.register("body")} />
        </Field>
        <Field id="audience" label="Send to" error={e.audience?.message} required>
          <NativeSelect {...form.register("audience")}>
            {Object.entries(AUDIENCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </NativeSelect>
        </Field>
        {audience === "TIER" && (
          <Field id="tierId" label="Tier" error={e.tierId?.message} required>
            <NativeSelect {...form.register("tierId")}>
              <option value="">Choose a tier</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </NativeSelect>
          </Field>
        )}
        <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <Users className="size-4" aria-hidden />
          {recipients === null ? "—" : `${recipients} recipient${recipients === 1 ? "" : "s"}`}
        </p>
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto sm:justify-self-start">
          <Send aria-hidden /> Review and send
        </Button>
      </form>

      <section aria-label="Preview" className="min-w-0">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Email preview</p>
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="bg-primary px-5 py-4 text-primary-foreground">
            <p className="font-bold">NBCC <span className="font-semibold text-brand-gold">Member Portal</span></p>
          </div>
          <div className="space-y-3 p-5">
            <h2 className="text-xl font-bold break-words text-primary">{title || "Your title"}</h2>
            {(body || "Your message will appear here.").split(/\n{2,}/).map((p, i) => (
              <p key={i} className="text-sm whitespace-pre-line">{p}</p>
            ))}
            <span className="inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">View in the portal</span>
          </div>
        </div>
      </section>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Send this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              “{confirm?.title}” will be emailed to {recipients ?? "the selected"} member{recipients === 1 ? "" : "s"} and shown in the member portal. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(ev) => {
                ev.preventDefault();
                if (confirm) send(confirm);
              }}
            >
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Send now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
