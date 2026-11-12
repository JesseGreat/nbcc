import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MemberStatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/rbac";
import { can } from "@/lib/roles";
import { daysUntil, formatDate, formatDateTime } from "@/lib/dates";
import { logoPublicUrl } from "@/lib/storage";
import { getMemberAuditTrail, getMemberDetail } from "@/modules/members/queries";
import { listAllTiers } from "@/modules/settings/queries";
import { AuditTrail, CompanyDetails, ContactDetails, DetailList, DocumentsList, Section } from "@/modules/members/components/member-sections";
import { MemberAdminActions } from "@/modules/members/components/admin/member-admin-actions";
import { PaymentList } from "@/modules/payments/components/payment-list";

export const metadata: Metadata = { title: "Member" };

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin("members.view");
  const { id } = await params;
  const [m, trail, tiers] = await Promise.all([getMemberDetail(id), getMemberAuditTrail(id), listAllTiers()]);
  if (!m) notFound();

  const logo = logoPublicUrl(m.logoPath);
  const days = m.expiresAt ? daysUntil(m.expiresAt) : null;

  return (
    <>
      <Link href="/members" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Members
      </Link>
      <PageHeader
        title={m.companyName}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <MemberStatusBadge status={m.status} />
            {m.membershipNumber ?? "No membership number"} · {m.tier.name}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid min-w-0 gap-4 lg:col-span-2">
          <Section title="Membership">
            <DetailList
              items={[
                ["Membership number", m.membershipNumber],
                ["Status", <MemberStatusBadge key="s" status={m.status} />],
                ["Expires", m.expiresAt ? `${formatDate(m.expiresAt)}${days !== null ? ` (${days >= 0 ? `${days} days left` : `${-days} days ago`})` : ""}` : null],
                ["Approved", m.approvedAt ? `${formatDate(m.approvedAt)}${m.approvedBy ? ` by ${m.approvedBy.name}` : ""}` : null],
                ["Portal login", m.user ? `${m.user.email}${m.user.lastLoginAt ? ` · last seen ${formatDateTime(m.user.lastLoginAt)}` : ""}` : "No portal account"],
                ...(m.rejectionReason ? [["Rejection reason", m.rejectionReason] as [string, string]] : []),
                ...(m.blacklistReason ? [["Blacklist reason", m.blacklistReason] as [string, string]] : []),
              ]}
            />
          </Section>
          <Section title="Company">
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded logo from storage
              <img src={logo} alt={`${m.companyName} logo`} className="mb-4 h-16 w-auto rounded border bg-white object-contain p-1" />
            )}
            <CompanyDetails m={m} />
          </Section>
          <Section title="Contacts">
            <ContactDetails m={m} />
          </Section>
          <Section title="Payments">
            <PaymentList payments={m.payments} />
          </Section>
        </div>

        <div className="grid min-w-0 content-start gap-4">
          {can(user.role, "members.manage") && m.status !== "PENDING_APPROVAL" && m.status !== "PENDING_VERIFICATION" && (
            <Section title="Actions">
              <MemberAdminActions memberId={m.id} status={m.status} tierId={m.tierId} tiers={tiers.map((t) => ({ id: t.id, name: t.name }))} />
            </Section>
          )}
          {(m.status === "PENDING_APPROVAL" || m.status === "PENDING_VERIFICATION") && (
            <Section title="Application">
              <Link href={`/applications/${m.id}`} className="text-sm font-medium text-primary hover:underline">
                Review application →
              </Link>
            </Section>
          )}
          <Section title="Documents">
            <DocumentsList documents={m.documents} />
          </Section>
          <Section title="Audit trail">
            <AuditTrail entries={trail} />
          </Section>
        </div>
      </div>
    </>
  );
}
