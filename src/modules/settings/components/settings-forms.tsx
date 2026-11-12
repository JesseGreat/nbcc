"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RotateCcw, Save, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { ActionDialog } from "@/components/action-dialog";
import type { AnyActionResult } from "@/lib/action-result";
import {
  inviteStaffAction,
  resetDemoDataAction,
  saveReminderSettingsAction,
  saveSectorAction,
  saveTierAction,
  updateStaffAction,
} from "../actions";

type Role = "SUPER_ADMIN" | "ADMIN" | "STAFF";
const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "STAFF", label: "Staff" },
];

/** Runs an action, toasts the outcome and refreshes server data. */
function useSave() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<AnyActionResult>, success: string, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        const field = res.fieldErrors && Object.values(res.fieldErrors).flat()[0];
        toast.error(field ?? res.error);
        return;
      }
      toast.success(success);
      after?.();
      router.refresh();
    });
  return { pending, run };
}

function ActiveToggle({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-11 items-center gap-2 text-sm">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[var(--brand-navy)]" />
      Active
    </label>
  );
}

export function TierRow({ tier }: { tier?: { id: string; name: string; description: string | null; feeMajor: number; isActive: boolean; members: number } }) {
  const [name, setName] = useState(tier?.name ?? "");
  const [description, setDescription] = useState(tier?.description ?? "");
  const [fee, setFee] = useState(String(tier?.feeMajor ?? ""));
  const [active, setActive] = useState(tier?.isActive ?? true);
  const { pending, run } = useSave();
  const key = tier?.id ?? "new";

  return (
    <form
      className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_10rem_auto_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => saveTierAction({ id: tier?.id, name, description, feeMajor: Number(fee), isActive: active }),
          tier ? "Tier saved." : "Tier added.",
          () => {
            if (!tier) {
              setName("");
              setDescription("");
              setFee("");
            }
          },
        );
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor={`tier-name-${key}`}>{tier ? `Tier${tier.members ? ` · ${tier.members} members` : ""}` : "New tier name"}</Label>
        <Input id={`tier-name-${key}`} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input aria-label="Description" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`tier-fee-${key}`}>Annual fee (₦)</Label>
        <Input id={`tier-fee-${key}`} type="number" inputMode="numeric" min={0} step={1} value={fee} onChange={(e) => setFee(e.target.value)} required />
      </div>
      <ActiveToggle id={`tier-active-${key}`} checked={active} onChange={setActive} />
      <Button type="submit" variant={tier ? "secondary" : "default"} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : tier ? <Save aria-hidden /> : <Plus aria-hidden />}
        {tier ? "Save" : "Add tier"}
      </Button>
    </form>
  );
}

export function SectorRow({ sector }: { sector?: { id: string; name: string; isActive: boolean; members: number } }) {
  const [name, setName] = useState(sector?.name ?? "");
  const [active, setActive] = useState(sector?.isActive ?? true);
  const { pending, run } = useSave();
  const key = sector?.id ?? "new";
  return (
    <form
      className="flex flex-wrap items-center gap-2 border-b py-2 last:border-0"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveSectorAction({ id: sector?.id, name, isActive: active }), sector ? "Sector saved." : "Sector added.", () => !sector && setName(""));
      }}
    >
      <label htmlFor={`sector-${key}`} className="sr-only">{sector ? "Sector name" : "New sector name"}</label>
      <Input id={`sector-${key}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="New sector" className="min-w-0 flex-1 basis-48" required />
      {sector && <span className="w-20 text-xs text-muted-foreground">{sector.members} members</span>}
      <ActiveToggle id={`sector-active-${key}`} checked={active} onChange={setActive} />
      <Button type="submit" size="sm" variant={sector ? "ghost" : "secondary"} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : sector ? "Save" : <><Plus aria-hidden /> Add</>}
      </Button>
    </form>
  );
}

export function ReminderSettingsForm({ startDays, interval }: { startDays: number; interval: number }) {
  const [s, setS] = useState(String(startDays));
  const [i, setI] = useState(String(interval));
  const { pending, run } = useSave();
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveReminderSettingsAction({ startDaysBeforeExpiry: Number(s), intervalDays: Number(i) }), "Reminder schedule saved.");
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="rem-start">Start reminding (days before expiry)</Label>
        <Input id="rem-start" type="number" inputMode="numeric" min={7} max={365} value={s} onChange={(e) => setS(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="rem-int">Then every (days)</Label>
        <Input id="rem-int" type="number" inputMode="numeric" min={1} max={180} value={i} onChange={(e) => setI(e.target.value)} />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Save
      </Button>
    </form>
  );
}

export function StaffRow({ staff, isSelf }: { staff: { id: string; name: string; email: string; role: Role; isDisabled: boolean }; isSelf: boolean }) {
  const [role, setRole] = useState<Role>(staff.role);
  const [disabled, setDisabled] = useState(staff.isDisabled);
  const { pending, run } = useSave();
  const dirty = role !== staff.role || disabled !== staff.isDisabled;
  return (
    <li className="grid gap-2 border-b py-3 last:border-0 md:grid-cols-[1fr_11rem_auto_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate font-medium">{staff.name}{isSelf && <span className="text-muted-foreground"> (you)</span>}</p>
        <p className="truncate text-sm text-muted-foreground">{staff.email}</p>
      </div>
      <div>
        <label htmlFor={`role-${staff.id}`} className="sr-only">Role for {staff.name}</label>
        <NativeSelect id={`role-${staff.id}`} value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={isSelf}>
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </NativeSelect>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} disabled={isSelf} className="size-5 accent-[var(--brand-navy)]" />
        Disabled
      </label>
      <Button size="sm" variant="secondary" disabled={!dirty || pending} onClick={() => run(() => updateStaffAction({ userId: staff.id, role, isDisabled: disabled }), "Staff user updated.")}>
        {pending && <Loader2 className="animate-spin" aria-hidden />} Save
      </Button>
    </li>
  );
}

export function InviteStaffForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("STAFF");
  const { pending, run } = useSave();
  return (
    <form
      className="grid gap-3 md:grid-cols-[1fr_1fr_10rem_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => inviteStaffAction({ name, email, role }), "Invitation sent.", () => {
          setName("");
          setEmail("");
        });
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="inv-name">Name</Label>
        <Input id="inv-name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="inv-email">Email</Label>
        <Input id="inv-email" type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="inv-role">Role</Label>
        <NativeSelect id="inv-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </NativeSelect>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <UserPlus aria-hidden />} Invite
      </Button>
    </form>
  );
}

export function ResetDemoButton() {
  return (
    <ActionDialog
      trigger={<Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"><RotateCcw aria-hidden /> Reset demo data</Button>}
      title="Reset all demo data?"
      description="All members, payments, announcements and audit logs are deleted and the demo data is recreated. Staff accounts are kept. This takes up to a minute."
      confirmLabel="Reset demo data"
      destructive
      successMessage="Demo data has been reset."
      run={() => resetDemoDataAction()}
    />
  );
}
