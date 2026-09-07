import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-card shadow-[var(--shadow)]", className)} {...props} />;
}

export function Badge({
  className,
  tone = "navy",
  ...props
}: React.ComponentProps<"span"> & { tone?: "navy" | "accent" | "success" | "warning" | "muted" | "danger" }) {
  const tones = {
    navy: "bg-slate text-ink",
    accent: "bg-accent-soft text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    muted: "bg-navy-soft text-muted",
    danger: "bg-danger/15 text-danger",
  };
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}

export function EmptyState({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <Card className="px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </Card>
  );
}

export function KpiCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="number mt-1 text-3xl font-bold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-slate" />
      <div className="h-32 animate-pulse rounded-2xl bg-slate" />
      <div className="h-32 animate-pulse rounded-2xl bg-slate" />
    </div>
  );
}
