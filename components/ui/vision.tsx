import { VISION_BANNER } from "@/lib/vision";

export function DemoBanner({ children }: { children?: string }) {
  return (
    <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
      {children ?? VISION_BANNER}
    </p>
  );
}

export function FutureSurface({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-line bg-card/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Future / partner</p>
      <h2 className="mt-1 text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
