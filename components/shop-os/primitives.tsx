import { cn } from "@/lib/utils";
import Link from "next/link";

export function ShopCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-[#e6eef6] bg-white shadow-[0_8px_24px_rgba(15,40,70,0.04)]", className)}>
      {children}
    </section>
  );
}

export function ShopPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#102033]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#6b7c8d]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ShopPill({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", className)}>
      {label}
    </span>
  );
}

export function ShopKpi({
  icon,
  label,
  value,
  hint,
  tone = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "blue" | "amber" | "green" | "navy" | "sky";
}) {
  const tones = {
    blue: "bg-[#eef4ff] text-[#2f7bff]",
    amber: "bg-[#fff6e8] text-[#d97706]",
    green: "bg-[#e9f8ef] text-[#16a34a]",
    navy: "bg-[#e8f8ef] text-[#15803d]",
    sky: "bg-[#eef6ff] text-[#2563eb]",
  };
  return (
    <ShopCard className="flex items-start gap-3 p-4">
      <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-[#6b7c8d]">{label}</p>
        <p className="mt-0.5 text-[26px] font-extrabold leading-none tracking-tight text-[#102033]">{value}</p>
        {hint ? <div className="mt-1.5 text-[11px] font-semibold">{hint}</div> : null}
      </div>
    </ShopCard>
  );
}

export function ShopDelta({ value, suffix = "from yesterday" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={up ? "text-[#16a34a]" : "text-[#c4453c]"}>
      {up ? "↑" : "↓"} {Math.abs(value)}% {suffix}
    </span>
  );
}

export function ShopTabs({
  items,
}: {
  items: { href: string; label: string; active?: boolean; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold",
            item.active ? "bg-[#2f7bff] text-white" : "bg-white text-[#5c6b7a] ring-1 ring-[#e6eef6] hover:bg-[#f4f7fb]",
          )}
        >
          {item.label}
          {item.count != null ? <span className="ml-1 opacity-80">({item.count})</span> : null}
        </Link>
      ))}
    </div>
  );
}

export function ShopButton({
  href,
  children,
  variant = "primary",
  type = "button",
  name,
  value,
  form,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  type?: "button" | "submit";
  name?: string;
  value?: string;
  form?: string;
  className?: string;
}) {
  const styles = {
    primary: "bg-[#2f7bff] text-white hover:bg-[#2568e8]",
    secondary: "border border-[#dbe3ec] bg-white text-[#102033] hover:bg-[#f4f7fb]",
    danger: "bg-[#e23d3d] text-white hover:bg-[#c92a2a]",
    ghost: "text-[#2f7bff] hover:bg-[#e8f1ff]",
    success: "bg-[#16a34a] text-white hover:bg-[#15803d]",
  };
  const cls = cn(
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold",
    styles[variant],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} name={name} value={value} form={form} className={cls}>
      {children}
    </button>
  );
}

export function ShopEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="font-semibold text-[#102033]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#6b7c8d]">{body}</p>
    </div>
  );
}

export function ShopSectionTitle({
  title,
  href,
  action = "View All",
}: {
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <h2 className="text-[15px] font-bold text-[#102033]">{title}</h2>
      {href ? (
        <Link href={href} className="text-[12px] font-semibold text-[#2f7bff]">
          {action}
        </Link>
      ) : null}
    </div>
  );
}
