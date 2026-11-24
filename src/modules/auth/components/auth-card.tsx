import { BrandCrest } from "@/components/brand";

export function AuthCard({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 md:py-14">
      <div className="nbcc-rise relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xl shadow-primary/5 md:p-8">
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-navy via-brand-gold to-brand-navy" />
        <BrandCrest className="nbcc-float mx-auto mb-5 w-28" />
        <h1 className="text-center text-2xl font-bold text-primary">{title}</h1>
        {description && <div className="mt-1 text-center text-sm text-muted-foreground">{description}</div>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
