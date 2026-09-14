import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-line bg-paper", className)} {...props} />;
}

export function Badge({
  className,
  tone = "navy",
  ...props
}: React.ComponentProps<"span"> & { tone?: "navy" | "accent" | "success" | "warning" | "muted" }) {
  const tones = {
    navy: "bg-[#071422] text-white",
    accent: "bg-accent-soft text-accent",
    success: "bg-emerald-50 text-success",
    warning: "bg-amber-50 text-warning",
    muted: "bg-paper text-muted",
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
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </Card>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 w-48 rounded-lg bg-line" />
      <div className="h-24 rounded-2xl bg-line" />
      <div className="h-24 rounded-2xl bg-line" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
