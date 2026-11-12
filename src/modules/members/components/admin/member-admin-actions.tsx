"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Ban, Loader2, PauseCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { MemberStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { ActionDialog } from "@/components/action-dialog";
import { changeStatusAction, changeTierAction } from "../../admin-actions";

type Tier = { id: string; name: string };

export function MemberAdminActions({
  memberId,
  status,
  tierId,
  tiers,
}: {
  memberId: string;
  status: MemberStatus;
  tierId: string;
  tiers: Tier[];
}) {
  const [tier, setTier] = useState(tierId);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const saveTier = () =>
    startTransition(async () => {
      const res = await changeTierAction({ memberId, tierId: tier });
      if (res.ok) {
        toast.success("Tier updated.");
        router.refresh();
      } else toast.error(res.error);
    });

  const outline = "justify-start";
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="tier">Membership tier</Label>
        <div className="flex gap-2">
          <NativeSelect id="tier" value={tier} onChange={(e) => setTier(e.target.value)}>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
          <Button onClick={saveTier} disabled={pending || tier === tierId} variant="secondary">
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        {status === "ACTIVE" && (
          <ActionDialog
            trigger={<Button variant="outline" className={outline}><PauseCircle aria-hidden /> Mark inactive</Button>}
            title="Mark this member inactive?"
            description="They will be removed from the directory until they pay or are restored."
            confirmLabel="Mark inactive"
            successMessage="Member marked inactive."
            run={() => changeStatusAction({ memberId, action: "deactivate" })}
          />
        )}
        {(status === "ACTIVE" || status === "INACTIVE") && (
          <ActionDialog
            trigger={<Button variant="outline" className={outline}><Archive aria-hidden /> Archive</Button>}
            title="Archive this member?"
            description="Archived members keep all records but are hidden from active lists."
            confirmLabel="Archive"
            successMessage="Member archived."
            run={() => changeStatusAction({ memberId, action: "archive" })}
          />
        )}
        {(status === "INACTIVE" || status === "ARCHIVED" || status === "BLACKLISTED") && (
          <ActionDialog
            trigger={<Button variant="outline" className={outline}><RotateCcw aria-hidden /> Restore</Button>}
            title="Restore this member?"
            description="They become Active if their paid period is still running, otherwise Inactive (awaiting payment)."
            confirmLabel="Restore"
            successMessage="Member restored."
            run={() => changeStatusAction({ memberId, action: "restore" })}
          />
        )}
        {status !== "BLACKLISTED" && status !== "PENDING_VERIFICATION" && (
          <ActionDialog
            trigger={
              <Button variant="outline" className={`${outline} border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive`}>
                <Ban aria-hidden /> Blacklist
              </Button>
            }
            title="Blacklist this member?"
            description="They lose access to the member portal. A reason is required and is kept in the audit log."
            confirmLabel="Blacklist"
            destructive
            reason={{ label: "Reason", required: true }}
            successMessage="Member blacklisted."
            run={(reason) => changeStatusAction({ memberId, action: "blacklist", reason })}
          />
        )}
      </div>
    </div>
  );
}
