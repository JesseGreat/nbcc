import Link from "next/link";
import { ArrowRight, Bell, CalendarClock, CreditCard, Hash, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberStatusBadge } from "@/components/status-badge";
import { requireMember } from "@/lib/rbac";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { daysLeft, getPayState } from "@/modules/renewals/rules";
import { getReminderConfig } from "@/modules/settings/queries";
import { listAnnouncementsForMember } from "@/modules/announcements/queries";

export default async function MemberDashboardPage() {
  const user = await requireMember();
  const m = user.member;
  const [paidCount, reminderCfg, announcements] = await Promise.all([
    db.payment.count({ where: { memberId: m.id, status: "SUCCESS" } }),
    getReminderConfig(),
    listAnnouncementsForMember(m, 3),
  ]);
  const pay = getPayState({ status: m.status, expiresAt: m.expiresAt, hasPaidBefore: paidCount > 0 }, reminderCfg);
  const left = daysLeft(m.expiresAt);

  return (
    <div className="grid gap-5">
      <section className="nbcc-hero nbcc-rise rounded-2xl p-6 shadow-lg md:p-8" style={{ "--d": 0 } as React.CSSProperties}>
        <span aria-hidden className="nbcc-orb -top-16 -right-10 size-56 bg-brand-gold/40" />
        <span aria-hidden className="nbcc-orb -bottom-24 left-1/3 size-64 bg-sky-400/25 [animation-delay:-6s]" />
        <p className="text-sm font-medium text-white/70">Welcome back, {user.name.split(" ")[0]}</p>
        <h1 className="nbcc-gold-text mt-1 text-2xl font-bold tracking-tight md:text-4xl">{m.companyName}</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur">{m.tier.name} member</span>
          {m.membershipNumber && (
            <span className="rounded-full border border-brand-gold/40 bg-brand-gold/15 px-3 py-1 text-[#f3d77a] tabular-nums backdrop-blur">
              No. {m.membershipNumber}
            </span>
          )}
        </div>
      </section>

      {pay.canPay && (
        <section
          className={cn(
            "nbcc-rise flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center md:p-6",
            pay.urgent ? "bg-primary text-primary-foreground" : "border bg-card",
          )}
          style={{ "--d": 1 } as React.CSSProperties}
          aria-labelledby="pay-heading"
        >
          <div className="flex-1">
            <h2 id="pay-heading" className="text-lg font-semibold">
              {m.status === "ACTIVE"
                ? `Your membership expires in ${left} day${left === 1 ? "" : "s"}`
                : pay.purpose === "NEW"
                  ? "Activate your membership"
                  : "Your membership has expired"}
            </h2>
            <p className={cn("text-sm", pay.urgent ? "text-primary-foreground/80" : "text-muted-foreground")}>
              {m.tier.name} annual fee: {formatMoney(m.tier.feeMinor, m.tier.currency)}
            </p>
          </div>
          <Button asChild size="lg" className={pay.urgent ? "nbcc-pulse bg-brand-gold text-brand-navy hover:bg-brand-gold/90" : undefined}>
            <Link href="/member/payments">
              <CreditCard aria-hidden /> {pay.label}
            </Link>
          </Button>
        </section>
      )}

      <section aria-label="Membership summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat d={2} icon={Layers} label="Status" value={<MemberStatusBadge status={m.status} />} />
        <Stat d={3} icon={Hash} label="Membership no." value={<span className="tabular-nums">{m.membershipNumber ?? "—"}</span>} />
        <Stat d={4} icon={CreditCard} label="Tier" value={m.tier.name} />
        <Stat
          d={5}
          icon={CalendarClock}
          label="Expires"
          value={m.expiresAt ? formatDate(m.expiresAt) : "Not yet paid"}
          sub={left !== null ? (left >= 0 ? `${left} days left` : `Expired ${-left} days ago`) : undefined}
        />
      </section>

      {m.expiresAt && left !== null && left >= 0 && <RenewalProgress daysLeftValue={left} />}

      <section className="nbcc-rise rounded-2xl border bg-card p-5 md:p-6" style={{ "--d": 7 } as React.CSSProperties} aria-labelledby="news-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3">
          <h2 id="news-heading" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Bell className="size-5" aria-hidden /> Latest announcements
          </h2>
          <Link href="/member/announcements" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <ul className="divide-y">
            {announcements.map((a) => (
              <li key={a.id} className="nbcc-row -mx-2 rounded-lg px-2 py-3 hover:bg-muted/60">
                <p className="font-medium">{a.title}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(a.sentAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  d = 0,
}: {
  icon: typeof Hash;
  label: string;
  value: React.ReactNode;
  sub?: string;
  d?: number;
}) {
  return (
    <div className="nbcc-rise nbcc-card min-w-0 rounded-xl border bg-card p-4" style={{ "--d": d } as React.CSSProperties}>
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-3.5" aria-hidden />
        </span>
        {label}
      </p>
      <div className="mt-1.5 text-base font-semibold break-words md:text-lg">{value}</div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Visual countdown through the 12-month membership year. */
function RenewalProgress({ daysLeftValue }: { daysLeftValue: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((daysLeftValue / 365) * 100)));
  return (
    <div className="nbcc-rise rounded-xl border bg-card p-4" style={{ "--d": 6 } as React.CSSProperties}>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium">Membership year</span>
        <span className="text-muted-foreground">{daysLeftValue} days remaining</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Time remaining in membership year"
        aria-valuemin={0}
        aria-valuemax={365}
        aria-valuenow={daysLeftValue}
      >
        <div className={cn("nbcc-bar h-full rounded-full", daysLeftValue <= 30 ? "bg-destructive" : daysLeftValue <= 90 ? "bg-brand-gold" : "bg-success")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
