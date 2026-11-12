"use client";

import { useState, useTransition } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form/field";
import { startPaymentAction } from "../actions";

export function PayButton({ label, amountLabel }: { label: string; amountLabel: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  return (
    <div className="grid gap-3">
      <FormError message={error} />
      <Button
        size="lg"
        className="w-full bg-brand-gold text-brand-navy hover:bg-brand-gold/90 sm:w-auto"
        disabled={pending || redirecting}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await startPaymentAction();
            if (!res.ok) return setError(res.error);
            setRedirecting(true);
            window.location.assign(res.data.url);
          })
        }
      >
        {pending || redirecting ? <Loader2 className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
        {redirecting ? "Opening secure checkout…" : `${label} · ${amountLabel}`}
      </Button>
      <p className="text-xs opacity-80">Secure payment by Paystack: card, bank transfer or USSD.</p>
    </div>
  );
}
