"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/form/field";
import type { AnyActionResult } from "@/lib/action-result";

type Props = {
  trigger: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  reason?: { label: string; required: boolean; placeholder?: string };
  successMessage: string;
  run: (reason: string) => Promise<AnyActionResult>;
};

/** Confirmation dialog for admin actions, with an optional reason field. */
export function ActionDialog({ trigger, title, description, confirmLabel, destructive, reason, successMessage, run }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    setError(null);
    if (reason?.required && text.trim().length < 5) {
      setError("Please give a reason (at least 5 characters).");
      return;
    }
    startTransition(async () => {
      const res = await run(text.trim());
      if (!res.ok) {
        setError(res.fieldErrors?.reason?.[0] ?? res.error);
        return;
      }
      toast.success(successMessage);
      setOpen(false);
      setText("");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-3">
          <FormError message={error} />
          {reason && (
            <Field id="action-reason" label={reason.label} required={reason.required}>
              <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={reason.placeholder} />
            </Field>
          )}
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={pending}
            className={destructive ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
