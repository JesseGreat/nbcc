import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Download, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/rbac";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { fulfilPayment } from "@/modules/payments/service";

export const metadata: Metadata = { title: "Payment status" };
export const dynamic = "force-dynamic";

/** Paystack redirects here with ?reference=… after checkout. We verify server-side. */
export default async function PaymentCallbackPage({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  const user = await requireMember();
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref;

  const payment = reference ? await db.payment.findUnique({ where: { reference } }) : null;
  if (!payment || payment.memberId !== user.member.id) {
    return <Result icon="error" title="Payment not found" body="We could not find that payment. If you were charged, contact the Chamber with your reference." />;
  }

  let outcome: string = payment.status;
  let reason: string | null = null;
  if (payment.status === "PENDING") {
    try {
      const r = await fulfilPayment(payment.reference, "callback");
      outcome = r.outcome === "success" || (r.outcome === "already_processed" && r.status === "SUCCESS") ? "SUCCESS" : r.outcome === "failed" ? "FAILED" : "PENDING";
      if (r.outcome === "failed") reason = r.reason;
    } catch (err) {
      console.error("[payments] callback verify failed", err);
      outcome = "PENDING";
    }
  }

  if (outcome === "SUCCESS") {
    const p = await db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    return (
      <Result icon="success" title="Payment successful" body={`Thank you. Your membership is active until ${formatDate(p.periodEnd)}. A receipt has been emailed to you.`}>
        <dl className="mx-auto my-6 grid max-w-sm gap-2 rounded-xl bg-muted p-4 text-left text-sm">
          <Row k="Amount" v={formatMoney(p.amountMinor, p.currency)} />
          <Row k="Receipt" v={p.receiptNumber ?? "—"} />
          <Row k="Reference" v={p.reference} />
        </dl>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild size="lg">
            <a href={`/api/receipts/${p.id}`}>
              <Download aria-hidden /> Download receipt
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/member">Back to dashboard</Link>
          </Button>
        </div>
      </Result>
    );
  }

  if (outcome === "FAILED") {
    return (
      <Result icon="error" title="Payment was not completed" body={reason ?? "Your payment did not go through. No money was taken. Please try again."}>
        <Button asChild size="lg" className="mt-6">
          <Link href="/member/payments">Try again</Link>
        </Button>
      </Result>
    );
  }

  return (
    <Result icon="pending" title="Payment processing" body="We are waiting for confirmation from the payment provider. This page will show the result once it arrives; you will also get an email.">
      <Button asChild size="lg" variant="outline" className="mt-6">
        <Link href={`/member/payments/callback?reference=${encodeURIComponent(payment.reference)}`}>Check again</Link>
      </Button>
    </Result>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium break-all">{v}</dd>
    </div>
  );
}

function Result({ icon, title, body, children }: { icon: "success" | "error" | "pending"; title: string; body: string; children?: React.ReactNode }) {
  const Icon = icon === "success" ? CheckCircle2 : icon === "error" ? XCircle : Clock;
  const color = icon === "success" ? "text-success" : icon === "error" ? "text-destructive" : "text-warning";
  return (
    <div className="mx-auto max-w-lg py-6 text-center md:py-12" role="status">
      <Icon className={`mx-auto size-14 ${color}`} aria-hidden />
      <h1 className="mt-4 text-2xl font-bold text-primary">{title}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}
