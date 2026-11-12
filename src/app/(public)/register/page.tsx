import type { Metadata } from "next";
import Link from "next/link";
import { RegistrationWizard } from "@/modules/members/components/registration-wizard";
import { listActiveSectors, listActiveTiers } from "@/modules/settings/queries";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Apply for membership" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const [tiers, sectors] = await Promise.all([listActiveTiers(), listActiveSectors()]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold text-primary md:text-3xl">Apply for membership</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        It takes about 3 minutes. Have your CAC certificate ready (PDF, JPG or PNG).{" "}
        <span className="whitespace-nowrap">
          Already applied?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </span>
      </p>
      <RegistrationWizard
        tiers={tiers.map((t) => ({ id: t.id, name: t.name, description: t.description, feeLabel: formatMoney(t.feeMinor, t.currency) }))}
        sectors={sectors.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
