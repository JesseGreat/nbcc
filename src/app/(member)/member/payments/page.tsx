import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/rbac";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Section } from "@/modules/members/components/member-sections";
import { PaymentList } from "@/modules/payments/components/payment-list";
import { PayButton } from "@/modules/payments/components/pay-panel";
import { computePeriod, getPayState } from "@/modules/renewals/rules";
import { getReminderConfig } from "@/modules/settings/queries";

export const metadata: Metadata = { title: "Payments" };

export default async function MemberPaymentsPage() {
  const user = await requireMember();
  const m = user.member;
  const [payments, cfg] = await Promise.all([
    db.payment.findMany({ where: { memberId: m.id }, orderBy: { createdAt: "desc" } }),
    getReminderConfig(),
  ]);
  const hasPaidBefore = payments.some((p) => p.status === "SUCCESS");
  const state = getPayState({ status: m.status, expiresAt: m.expiresAt, hasPaidBefore }, cfg);
  const preview = computePeriod(m, new Date());

  return (
    <>
      <PageHeader title="Payments" description="Pay your membership fee and download receipts." />
      <div className="grid gap-4">
        {state.canPay ? (
          <section className="rounded-2xl bg-primary p-5 text-primary-foreground md:p-6" aria-labelledby="pay-heading">
            <h2 id="pay-heading" className="text-lg font-semibold">
              {state.purpose === "NEW" ? "Pay your first annual fee" : "Renew your membership"}
            </h2>
            <dl className="my-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-primary-foreground/70">Tier</dt>
                <dd className="font-semibold">{m.tier.name}</dd>
              </div>
              <div>
                <dt className="text-primary-foreground/70">Amount</dt>
                <dd className="font-semibold">{formatMoney(m.tier.feeMinor, m.tier.currency)}</dd>
              </div>
              <div>
                <dt className="text-primary-foreground/70">Covers</dt>
                <dd className="font-semibold">
                  {formatDate(preview.periodStart)} – {formatDate(preview.periodEnd)}
                </dd>
              </div>
            </dl>
            <PayButton label={state.label} amountLabel={formatMoney(m.tier.feeMinor, m.tier.currency)} />
          </section>
        ) : (
          <section className="flex items-start gap-3 rounded-2xl border bg-card p-5">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <div>
              <p className="font-semibold">
                {m.status === "ACTIVE" ? `You are paid up until ${formatDate(m.expiresAt)}` : "No payment due"}
              </p>
              <p className="text-sm text-muted-foreground">{state.reason}</p>
            </div>
          </section>
        )}

        <Section title="Payment history">
          <PaymentList payments={payments} />
        </Section>
      </div>
    </>
  );
}
