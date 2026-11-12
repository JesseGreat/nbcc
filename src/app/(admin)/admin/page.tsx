import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, ClipboardCheck, Users, UserCheck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/rbac";
import { formatMoney } from "@/lib/money";
import { getDashboardStats } from "@/modules/payments/queries";
import { RevenueChart, TierChart } from "@/modules/payments/components/dashboard-charts";
import { Section } from "@/modules/members/components/member-sections";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const { kpis, revenueByMonth, membersByTier } = await getDashboardStats();
  const year = new Date().getFullYear();

  const cards = [
    { label: "Total members", value: kpis.total.toLocaleString("en-GB"), icon: Users, href: "/members" },
    { label: "Active", value: kpis.active.toLocaleString("en-GB"), icon: UserCheck, href: "/members?status=ACTIVE" },
    { label: "Pending approval", value: kpis.pending.toLocaleString("en-GB"), icon: ClipboardCheck, href: "/applications", highlight: kpis.pending > 0 },
    { label: "Expiring in 90 days", value: kpis.expiring.toLocaleString("en-GB"), icon: CalendarClock, href: "/renewals" },
    { label: "Archived / blacklisted", value: kpis.archivedOrBlacklisted.toLocaleString("en-GB"), icon: AlertTriangle, href: "/members?status=ARCHIVED" },
    { label: `Revenue ${year}`, value: formatMoney(kpis.revenueYearMinor, "NGN", { compact: true }), full: formatMoney(kpis.revenueYearMinor, "NGN"), icon: Wallet, href: "/payments?status=SUCCESS" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome, ${user.name.split(" ")[0]}. Here is the Chamber at a glance.`} />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon, href, highlight, full }) => (
          <li key={label}>
            <Link
              href={href}
              className={`block h-full rounded-xl border p-4 transition-colors hover:border-primary/40 ${highlight ? "border-brand-gold bg-accent/60" : "bg-card"}`}
            >
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5" aria-hidden /> {label}
              </p>
              <p className="mt-2 text-2xl font-bold text-primary tabular-nums" title={full}>
                {value}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          <Section title="Revenue by month (NGN)">
            <RevenueChart data={revenueByMonth} />
            <details className="mt-2 text-sm">
              <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">Show as table</summary>
              <table className="w-full text-left">
                <thead><tr className="text-muted-foreground"><th scope="col" className="py-1 font-medium">Month</th><th scope="col" className="py-1 text-right font-medium">Revenue</th></tr></thead>
                <tbody>
                  {revenueByMonth.map((r) => (
                    <tr key={r.month} className="border-t"><td className="py-1">{r.label}</td><td className="py-1 text-right tabular-nums">{formatMoney(r.revenueMinor, "NGN")}</td></tr>
                  ))}
                </tbody>
              </table>
            </details>
          </Section>
        </div>
        <div className="min-w-0 xl:col-span-2">
          <Section title="Active members by tier">
            <TierChart data={membersByTier} />
            <details className="mt-2 text-sm">
              <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">Show as table</summary>
              <table className="w-full text-left">
                <thead><tr className="text-muted-foreground"><th scope="col" className="py-1 font-medium">Tier</th><th scope="col" className="py-1 text-right font-medium">Active members</th></tr></thead>
                <tbody>
                  {membersByTier.map((r) => (
                    <tr key={r.tier} className="border-t"><td className="py-1">{r.tier}</td><td className="py-1 text-right tabular-nums">{r.members}</td></tr>
                  ))}
                </tbody>
              </table>
            </details>
          </Section>
        </div>
      </div>

      {kpis.pending > 0 && (
        <Link href="/applications" className="mt-4 flex min-h-11 items-center justify-between rounded-xl border bg-card p-4 font-medium text-primary hover:bg-muted/50">
          Review {kpis.pending} pending application{kpis.pending === 1 ? "" : "s"} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </>
  );
}
