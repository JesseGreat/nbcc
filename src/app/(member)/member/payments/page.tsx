import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Section } from "@/modules/members/components/member-sections";
import { PaymentList } from "@/modules/payments/components/payment-list";

export const metadata: Metadata = { title: "Payments" };

export default async function MemberPaymentsPage() {
  const user = await requireMember();
  const payments = await db.payment.findMany({ where: { memberId: user.member.id }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageHeader title="Payments" description="Your membership payments and receipts." />
      {/* TODO(milestone 5): Paystack pay / renew panel */}
      <Section title="Payment history">
        <PaymentList payments={payments} />
      </Section>
    </>
  );
}
