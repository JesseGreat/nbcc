import type { MemberStatus, PaymentStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const MEMBER_STATUS: Record<MemberStatus, { label: string; className: string }> = {
  PENDING_VERIFICATION: { label: "Awaiting email", className: "bg-muted text-muted-foreground" },
  PENDING_APPROVAL: { label: "Pending approval", className: "bg-warning-soft text-warning" },
  ACTIVE: { label: "Active", className: "bg-success-soft text-success" },
  REJECTED: { label: "Rejected", className: "bg-destructive/10 text-destructive" },
  INACTIVE: { label: "Inactive", className: "bg-secondary text-secondary-foreground" },
  ARCHIVED: { label: "Archived", className: "bg-muted text-muted-foreground" },
  BLACKLISTED: { label: "Blacklisted", className: "bg-destructive text-white" },
};

export const MEMBER_STATUS_LABELS = Object.fromEntries(
  Object.entries(MEMBER_STATUS).map(([k, v]) => [k, v.label]),
) as Record<MemberStatus, string>;

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-warning-soft text-warning" },
  SUCCESS: { label: "Paid", className: "bg-success-soft text-success" },
  FAILED: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", className)}>
      {children}
    </span>
  );
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const s = MEMBER_STATUS[status];
  return <Pill className={s.className}>{s.label}</Pill>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT_STATUS[status];
  return <Pill className={s.className}>{s.label}</Pill>;
}
