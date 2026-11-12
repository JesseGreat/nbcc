import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { MemberStatusBadge } from "@/components/status-badge";
import { requireMember } from "@/lib/rbac";
import { ORG } from "@/lib/config";
import { DetailList, Section } from "@/modules/members/components/member-sections";
import { ProfileForm } from "@/modules/members/components/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireMember();
  const m = user.member;

  return (
    <>
      <PageHeader title="Company profile" description="Keep your contact details up to date." />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Section title="Contact details">
          <ProfileForm
            defaults={{
              website: m.website ?? "",
              address: m.address,
              mdName: m.mdName,
              mdEmail: m.mdEmail,
              mdPhone: m.mdPhone,
              repName: m.repName,
              repPhone: m.repPhone,
            }}
          />
        </Section>
        <div className="grid content-start gap-4">
          <Section title="Managed by the Chamber">
            <DetailList
              items={[
                ["Company name", m.companyName],
                ["RC number", m.rcNumber],
                ["Sector", m.sector.name],
                ["Tier", m.tier.name],
                ["Status", <MemberStatusBadge key="s" status={m.status} />],
                ["Membership number", m.membershipNumber],
                ["Login email", user.email],
              ]}
            />
            <p className="mt-4 text-xs text-muted-foreground">
              To change these, contact{" "}
              <a href={`mailto:${ORG.supportEmail}`} className="text-primary underline">
                {ORG.supportEmail}
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </>
  );
}
