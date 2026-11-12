import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/rbac";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  return <PageHeader title="Dashboard" description={`Signed in as ${user.name}`} />;
}
