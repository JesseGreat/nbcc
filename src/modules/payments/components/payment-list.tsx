import { Download } from "lucide-react";
import type { Payment } from "@prisma/client";
import { PaymentStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

/** Payment history as cards; used in the member area and the admin member page. */
export function PaymentList({ payments }: { payments: Payment[] }) {
  if (!payments.length) return <p className="text-sm text-muted-foreground">No payments yet.</p>;
  return (
    <ul className="grid gap-2">
      {payments.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border p-3">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {formatMoney(p.amountMinor, p.currency)}
              <PaymentStatusBadge status={p.status} />
            </p>
            <p className="text-sm text-muted-foreground">
              {p.purpose === "NEW" ? "New membership" : "Renewal"} · {p.tierName} · {formatDate(p.paidAt ?? p.createdAt)}
            </p>
            {p.periodStart && p.periodEnd && (
              <p className="text-xs text-muted-foreground">
                Covers {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
              </p>
            )}
          </div>
          {p.status === "SUCCESS" && p.receiptNumber && (
            <a
              href={`/api/receipts/${p.id}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium text-primary hover:bg-muted lg:min-h-9"
            >
              <Download className="size-4" aria-hidden /> Receipt
              <span className="sr-only">{p.receiptNumber}</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
