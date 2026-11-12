import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/rbac";

export default async function MemberDashboardPage() {
  const user = await requireMember();
  return <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} description={user.member.companyName} />;
}
