import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MemberStatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/rbac";
import { can } from "@/lib/roles";
import { formatMoney } from "@/lib/money";
import { getMemberDetail } from "@/modules/members/queries";
import { CompanyDetails, ContactDetails, DocumentsList, Section } from "@/modules/members/components/member-sections";
import { ApplicationDecision } from "@/modules/members/components/admin/application-decision";
import { logoPublicUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Application" };

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin("members.view");
  const { id } = await params;
  const m = await getMemberDetail(id);
  if (!m) notFound();

  const decidable = m.status === "PENDING_APPROVAL" || m.status === "PENDING_VERIFICATION";
  const logo = logoPublicUrl(m.logoPath);

  return (
    <>
      <Link href="/applications" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Applications
      </Link>
      <PageHeader
        title={m.companyName}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <MemberStatusBadge status={m.status} /> {m.tier.name} · {formatMoney(m.tier.feeMinor, m.tier.currency)} / year
          </span>
        }
      />

      {decidable && can(user.role, "applications.decide") ? (
        <div className="mb-6 rounded-xl border border-brand-gold/50 bg-accent/50 p-4">
          <p className="mb-3 text-sm text-accent-foreground">
            {m.status === "PENDING_VERIFICATION"
              ? "The applicant has not confirmed their email yet. You can reject now, or approve once they confirm."
              : "Review the details and documents below, then decide."}
          </p>
          <ApplicationDecision memberId={m.id} companyName={m.companyName} canApprove={m.status === "PENDING_APPROVAL"} />
        </div>
      ) : !decidable ? (
        <p className="mb-6 text-sm">
          This application has been decided.{" "}
          <Link href={`/members/${m.id}`} className="font-medium text-primary hover:underline">
            Open member record →
          </Link>
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
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
          <Section title="Reason for joining">
            <p className="text-sm whitespace-pre-line">{m.reasonForJoining}</p>
          </Section>
        </div>
        <div className="grid content-start gap-4">
          <Section title="Documents">
            <DocumentsList documents={m.documents} />
          </Section>
        </div>
      </div>
    </>
  );
}
