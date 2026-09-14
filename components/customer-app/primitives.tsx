import { cn } from "@/lib/utils";
import Link from "next/link";

export function AppLogo({ href = "/home" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[11px] bg-[#2f7bff] shadow-[0_6px_16px_rgba(47,123,255,0.35)]">
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
          <path
            fill="white"
            d="M9.2 6.8h8.1c4.35 0 7.7 2.85 7.7 6.95 0 4.15-3.35 7-7.7 7h-3.55V25.2H9.2V6.8zm4.55 4.15v5.55h3.35c1.95 0 3.15-1.1 3.15-2.75s-1.2-2.8-3.15-2.8h-3.35z"
          />
        </svg>
      </span>
      <span className="leading-[1.05] tracking-[0.18em] text-white">
        <span className="block text-[10px] font-extrabold">POCKET</span>
        <span className="block text-[10px] font-extrabold">MECHANIC</span>
      </span>
    </Link>
  );
}

export function AppCard({
  className,
  children,
  href,
}: {
  className?: string;
  children: React.ReactNode;
  href?: string;
}) {
  const classes = cn(
    "rounded-[22px] border border-white/10 bg-[#0c1d30] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cn(classes, "block transition hover:border-white/20")}>
        {children}
      </Link>
    );
  }
  return <div className={classes}>{children}</div>;
}

export function AppPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[28px] font-extrabold leading-[1.1] tracking-tight text-white">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-white/55">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0 pt-1">{action}</div> : null}
    </div>
  );
}

export function FilterTabs({
  tabs,
  value,
  param = "tab",
  extra,
}: {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  param?: string;
  extra?: Record<string, string | undefined>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const active = tab.id === value;
        const params = new URLSearchParams();
        if (extra) {
          for (const [key, item] of Object.entries(extra)) {
            if (item) params.set(key, item);
          }
        }
        if (tab.id !== tabs[0]?.id) params.set(param, tab.id);
        const href = params.toString() ? `?${params.toString()}` : "?";
        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-[13px] font-semibold",
              active ? "bg-[#2f7bff] text-white" : "border border-white/10 bg-[#0c1d30] text-white/70",
            )}
          >
            {tab.label}
            {tab.count != null ? ` (${tab.count})` : ""}
          </Link>
        );
      })}
    </div>
  );
}

export function StatusBadge({
  label,
  tone = "info",
}: {
  label: string;
  tone?: "info" | "warning" | "success" | "muted" | "danger";
}) {
  const styles = {
    info: "bg-[#2f7bff]/15 text-[#7eb0ff]",
    warning: "bg-[#c98412]/20 text-[#f3c56b]",
    success: "bg-[#1f8a5b]/20 text-[#3ee08f]",
    muted: "bg-white/10 text-white/65",
    danger: "bg-[#e23d3d]/15 text-[#ff8b8b]",
  }[tone];
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold", styles)}>{label}</span>;
}

export function ProgressTrack({
  steps,
  index,
}: {
  steps: string[];
  index: number;
}) {
  return (
    <div className="mt-3 px-1">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-3 right-3 top-[7px] h-px bg-white/10" />
        <div
          className="absolute left-3 top-[7px] h-px bg-[#3ee08f]"
          style={{ width: `calc(${Math.max(0, index) / Math.max(1, steps.length - 1)} * (100% - 24px))` }}
        />
        {steps.map((step, i) => {
          const done = i < index;
          const current = i === index;
          return (
            <div key={step} className="relative z-10 flex w-10 flex-col items-center">
              <span
                className={cn(
                  "h-[15px] w-[15px] rounded-full border-2",
                  done && "border-[#3ee08f] bg-[#3ee08f]",
                  current && "border-[#2f7bff] bg-[#2f7bff] ring-4 ring-[#2f7bff]/20",
                  !done && !current && "border-white/20 bg-[#071422]",
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-white/45">
        {steps.map((step, i) => (
          <span
            key={step}
            className={cn("w-14 text-center leading-tight", i === index && "text-[#7eb0ff]", i < index && "text-[#3ee08f]")}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

export function GhostCta({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[22px] border border-dashed border-[#2f7bff]/45 bg-[#0c1d30]/40 px-4 py-3.5"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f7bff]/15 text-[#2f7bff]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[#7eb0ff]">{title}</span>
        <span className="block text-xs text-white/50">{body}</span>
      </span>
      <span className="text-lg text-[#2f7bff]">›</span>
    </Link>
  );
}

export function SolidCta({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[22px] border border-[#2f7bff]/30 bg-[#102a4a] px-4 py-3.5"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f7bff]/20 text-[#2f7bff]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="block text-xs text-white/50">{body}</span>
      </span>
      <span className="text-lg text-[#2f7bff]">›</span>
    </Link>
  );
}

export function OutlineButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 flex-1 items-center justify-center rounded-full border border-white/15 px-3 text-sm font-semibold text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function PrimaryButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#2f7bff] px-3 text-sm font-semibold text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function SearchSortBar({
  action,
  searchName = "q",
  searchPlaceholder,
  searchDefault,
  sortName = "sort",
  sortDefault,
  sortOptions,
  hidden,
}: {
  action: string;
  searchName?: string;
  searchPlaceholder: string;
  searchDefault?: string;
  sortName?: string;
  sortDefault?: string;
  sortOptions: { value: string; label: string }[];
  hidden?: Record<string, string>;
}) {
  return (
    <form action={action} className="mt-3 flex gap-2">
      {hidden
        ? Object.entries(hidden).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)
        : null}
      <input
        name={searchName}
        defaultValue={searchDefault}
        placeholder={searchPlaceholder}
        className="h-10 min-w-0 flex-1 rounded-full border border-white/10 bg-[#0c1d30] px-4 text-sm text-white outline-none placeholder:text-white/35"
      />
      <select
        name={sortName}
        defaultValue={sortDefault}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-10 max-w-[44%] rounded-full border border-white/10 bg-[#0c1d30] px-3 text-xs font-semibold text-white outline-none"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}

export function VerifiedMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-3.5 w-3.5 text-[#2f7bff]", className)} aria-label="Verified">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path d="M4.6 8.2 6.7 10.3 11.4 5.7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
