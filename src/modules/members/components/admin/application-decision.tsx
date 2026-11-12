"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionDialog } from "@/components/action-dialog";
import { approveApplicationAction, rejectApplicationAction } from "../../admin-actions";

export function ApplicationDecision({ memberId, companyName, canApprove }: { memberId: string; companyName: string; canApprove: boolean }) {
  return (
    <div className="grid gap-2 sm:flex">
      {canApprove && (
        <ActionDialog
          trigger={
            <Button size="lg" className="bg-success text-white hover:bg-success/90">
              <Check aria-hidden /> Approve
            </Button>
          }
          title={`Approve ${companyName}?`}
          description="A membership number will be issued and the applicant will be emailed and asked to pay their first annual fee."
          confirmLabel="Approve application"
          successMessage="Application approved. Membership number issued."
          run={() => approveApplicationAction({ memberId })}
        />
      )}
      <ActionDialog
        trigger={
          <Button size="lg" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive">
            <X aria-hidden /> Reject
          </Button>
        }
        title={`Reject ${companyName}?`}
        description="The applicant will receive an email with the reason you give."
        confirmLabel="Reject application"
        destructive
        reason={{ label: "Reason (shared with the applicant)", required: true }}
        successMessage="Application rejected."
        run={(reason) => rejectApplicationAction({ memberId, reason })}
      />
    </div>
  );
}
