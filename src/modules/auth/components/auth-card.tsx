export function AuthCard({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 md:py-16">
      <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
