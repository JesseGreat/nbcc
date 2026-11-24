import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, ClipboardCheck, Users, UserCheck, Wallet } from "lucide-react";
import { requireAdmin } from "@/lib/rbac";
import { formatMoney } from "@/lib/money";
import { getDashboardStats } from "@/modules/payments/queries";
import { RevenueChart, TierChart } from "@/modules/payments/components/dashboard-charts";
import { Section } from "@/modules/members/components/member-sections";
import { isDemoMode } from "@/lib/env";
import { DEMO_DASHBOARD } from "@/modules/demo/dashboard-figures";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const stats = await getDashboardStats();
  let { kpis, revenueByMonth, membersByTier } = stats;
  if (isDemoMode()) {
    const d = DEMO_DASHBOARD;
    const revenueMinor = d.revenueNaira * 100;
    kpis = { ...kpis, total: d.total, active: d.active, expiring: d.expiring, archivedOrBlacklisted: d.archivedOrBlacklisted, revenueYearMinor: revenueMinor };
    revenueByMonth = revenueByMonth.map((m, i) => ({ ...m, revenueMinor: Math.round((revenueMinor * (d.monthlyShare[i] ?? 0)) / 100) }));
    membersByTier = d.tiers;
  }
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
      <section className="nbcc-hero nbcc-rise mb-5 rounded-2xl p-6 shadow-lg md:p-8" style={{ "--d": 0 } as React.CSSProperties}>
        <span aria-hidden className="nbcc-orb -top-16 -right-10 size-56 bg-brand-gold/40" />
        <span aria-hidden className="nbcc-orb -bottom-24 left-1/3 size-64 bg-sky-400/25 [animation-delay:-6s]" />
        <p className="text-sm font-medium text-white/70">Welcome, {user.name.split(" ")[0]}</p>
        <h1 className="nbcc-gold-text mt-1 text-2xl font-bold tracking-tight md:text-4xl">The Chamber at a glance</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 tabular-nums backdrop-blur">
            {kpis.total.toLocaleString("en-GB")} members
          </span>
          <span className="rounded-full border border-brand-gold/40 bg-brand-gold/15 px-3 py-1 text-[#f3d77a] tabular-nums backdrop-blur">
            {formatMoney(kpis.revenueYearMinor, "NGN", { compact: true })} revenue in {year}
          </span>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon, href, highlight, full }, i) => (
          <li key={label} className="nbcc-rise" style={{ "--d": i + 1 } as React.CSSProperties}>
            <Link
              href={href}
              className={`nbcc-card block h-full rounded-xl border p-4 ${highlight ? "border-brand-gold bg-accent/60" : "bg-card"}`}
            >
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold text-primary tabular-nums" title={full}>
                {value}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <div className="nbcc-rise min-w-0 xl:col-span-3" style={{ "--d": 7 } as React.CSSProperties}>
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
        <div className="nbcc-rise min-w-0 xl:col-span-2" style={{ "--d": 8 } as React.CSSProperties}>
          <Section title={isDemoMode() ? "Members by tier" : "Active members by tier"}>
            <TierChart data={membersByTier} />
            <details className="mt-2 text-sm">
              <summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">Show as table</summary>
              <table className="w-full text-left">
                <thead><tr className="text-muted-foreground"><th scope="col" className="py-1 font-medium">Tier</th><th scope="col" className="py-1 text-right font-medium">Members</th></tr></thead>
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
        <Link href="/applications" className="nbcc-rise nbcc-card mt-4 flex min-h-11 items-center justify-between rounded-xl border border-brand-gold bg-accent/60 p-4 font-medium text-primary">
          Review {kpis.pending} pending application{kpis.pending === 1 ? "" : "s"} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </>
  );
}
