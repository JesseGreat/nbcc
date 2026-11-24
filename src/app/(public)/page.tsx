import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, CreditCard, FileText, Megaphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandCrest } from "@/components/brand";
import { listActiveTiers } from "@/modules/settings/queries";
import { formatMoney } from "@/lib/money";
import { ORG } from "@/lib/config";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: FileText, title: "Apply online", text: "Submit your application and documents from any device, in minutes." },
  { icon: CreditCard, title: "Pay securely", text: "Pay or renew your membership by card, bank transfer or USSD via Paystack." },
  { icon: BadgeCheck, title: "Instant receipts", text: "Download official PDF receipts for every payment, any time." },
  { icon: Building2, title: "Member directory", text: "Find and connect with fellow member companies across sectors." },
  { icon: Megaphone, title: "Chamber news", text: "Receive announcements, events and updates from the Chamber." },
  { icon: ShieldCheck, title: "Always up to date", text: "See your status, membership number and renewal date at a glance." },
];

export default async function LandingPage() {
  const tiers = await listActiveTiers();

  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1fr_auto] md:py-24">
          <div>
          <p className="mb-3 text-sm font-semibold tracking-wider text-brand-gold uppercase">{ORG.name}</p>
          <h1 className="max-w-3xl text-3xl leading-tight font-bold tracking-tight md:text-5xl">
            Your Chamber membership, managed in one place.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-primary-foreground/80 md:text-lg">
            Apply for membership, pay and renew your dues, download receipts and connect with fellow members of the
            Nigerian-British business community.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90">
              <Link href="/register">
                Apply for membership <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">Member login</Link>
            </Button>
          </div>
          </div>
          <div className="hidden rounded-2xl bg-white p-6 shadow-lg md:block">
            <BrandCrest priority className="w-56 lg:w-64" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-2xl font-bold text-primary md:text-3xl">
          What you can do in the portal
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="nbcc-reveal nbcc-card rounded-xl border bg-card p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand-navy to-[#1d4a7a] text-brand-gold shadow-md">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t bg-card" aria-labelledby="tiers-heading">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 id="tiers-heading" className="text-2xl font-bold text-primary md:text-3xl">
            Membership tiers
          </h2>
          <p className="mt-2 text-muted-foreground">Annual fees. Membership runs for 12 months from the date of payment.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {tiers.map((tier) => (
              <li key={tier.id} className="nbcc-reveal nbcc-card nbcc-tier flex flex-col rounded-xl border bg-background p-5">
                <h3 className="font-semibold text-primary">{tier.name}</h3>
                <p className="mt-2 text-2xl font-bold">{formatMoney(tier.feeMinor, tier.currency)}</p>
                <p className="text-xs text-muted-foreground">per year</p>
                {tier.description && <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
            <Link href="/register">
              Start your application <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
