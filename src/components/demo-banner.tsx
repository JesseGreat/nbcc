"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "nbcc-demo-banner-dismissed";

/** Only rendered when DEMO_MODE=true (checked in the root layout). */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div role="status" className="pt-safe bg-brand-gold text-brand-navy">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 text-sm font-medium">
        <p className="flex-1 text-center">Demo environment — test payments only</p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(STORAGE_KEY, "1");
            } catch {}
          }}
          className="-my-1 inline-flex size-11 items-center justify-center rounded-md hover:bg-black/10 md:size-8"
          aria-label="Dismiss demo banner"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
