"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ActionDialog } from "@/components/action-dialog";
import { sendBulkRemindersAction, sendReminderAction } from "../actions";

export function ReminderButton({ memberId }: { memberId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await sendReminderAction({ memberId });
          if (res.ok) {
            toast.success("Reminder sent.");
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
      Send reminder
    </Button>
  );
}

export function BulkReminderButton({ memberIds, label }: { memberIds: string[]; label: string }) {
  return (
    <ActionDialog
      trigger={
        <Button>
          <Send aria-hidden /> {label}
        </Button>
      }
      title="Send renewal reminders?"
      description={`${memberIds.length} member${memberIds.length === 1 ? "" : "s"} will receive a renewal reminder email.`}
      confirmLabel="Send reminders"
      successMessage="Reminders sent."
      run={async () => {
        const res = await sendBulkRemindersAction({ memberIds });
        return res.ok ? { ok: true } : res;
      }}
    />
  );
}
