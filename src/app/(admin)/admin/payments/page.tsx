import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { PaymentStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/rbac";
import { can } from "@/lib/roles";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { listPayments, type PaymentFilters } from "@/modules/payments/queries";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<PaymentFilters> }) {
  const user = await requireAdmin("payments.view");
  const f = await searchParams;
  const { rows, total, page, pageCount, successTotalMinor } = await listPayments(f);

  const exportQs = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();

  return (
    <>
      <PageHeader
        title="Payments"
        description={`${total} payment${total === 1 ? "" : "s"} · ${formatMoney(successTotalMinor, "NGN")} received in this view`}
        actions={
          can(user.role, "payments.export") && (
            <Button asChild variant="outline">
              <a href={`/api/admin/payments/export${exportQs ? `?${exportQs}` : ""}`}>
                <Download aria-hidden /> Export CSV
              </a>
            </Button>
          )
        }
      />
      <FilterBar
        action="/payments"
        q={f.q}
        searchPlaceholder="Company, reference or receipt no."
        selects={[
          { name: "status", label: "Statuses", value: f.status, options: [{ value: "SUCCESS", label: "Paid" }, { value: "PENDING", label: "Pending" }, { value: "FAILED", label: "Failed" }] },
        ]}
        extra={
          <>
            <div className="lg:w-40">
              <label htmlFor="from" className="text-xs text-muted-foreground">From</label>
              <Input id="from" name="from" type="date" defaultValue={f.from} />
            </div>
            <div className="lg:w-40">
              <label htmlFor="to" className="text-xs text-muted-foreground">To</label>
              <Input id="to" name="to" type="date" defaultValue={f.to} />
            </div>
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments match these filters" />
      ) : (
        <>
          <ul className="grid gap-3 md:hidden">
            {rows.map((p) => (
              <li key={p.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/members/${p.member.id}`} className="min-w-0 font-semibold text-primary hover:underline">
                    {p.member.companyName}
                  </Link>
                  <PaymentStatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-lg font-bold tabular-nums">{formatMoney(p.amountMinor, p.currency)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(p.paidAt ?? p.createdAt)} · {p.purpose === "NEW" ? "New" : "Renewal"} · {p.channel ?? "—"}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{p.receiptNumber ?? p.reference}</p>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Member</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">Type</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Receipt / reference</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(p.paidAt ?? p.createdAt)}</td>
                    <td className="max-w-56 truncate px-4 py-3">
                      <Link href={`/members/${p.member.id}`} className="font-medium text-primary hover:underline">{p.member.companyName}</Link>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatMoney(p.amountMinor, p.currency)}</td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                    <td className="hidden px-4 py-3 lg:table-cell">{p.purpose === "NEW" ? "New" : "Renewal"}</td>
                    <td className="max-w-52 px-4 py-3">
                      {p.receiptNumber ? (
                        <a href={`/api/receipts/${p.id}`} className="text-primary hover:underline">{p.receiptNumber}</a>
                      ) : (
                        <span className="block truncate text-muted-foreground">{p.reference}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Pagination page={page} pageCount={pageCount} total={total} basePath="/payments" params={{ ...f }} />
    </>
  );
}
