"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "nbcc-demo-banner-dismissed";

/**
 * Only rendered when DEMO_MODE=true (checked in the root layout).
 * Sticky at the top; publishes its height as --banner-h so sticky sidebars
 * and headers sit just below it.
 */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (dismissed || !el) {
      root.style.setProperty("--banner-h", "0px");
      return;
    }
    const update = () => root.style.setProperty("--banner-h", `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div ref={ref} role="status" className="pt-safe sticky top-0 z-50 bg-brand-gold text-brand-navy">
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
          className="-my-1 inline-flex size-11 items-center justify-center rounded-md hover:bg-black/10 lg:size-8"
          aria-label="Dismiss demo banner"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
