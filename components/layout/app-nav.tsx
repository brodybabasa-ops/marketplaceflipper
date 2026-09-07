import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_NAV,
  CUSTOMER_MORE,
  MECHANIC_NAV,
  MECHANIC_MORE,
  ADMIN_NAV,
  HQ_NAV,
  HQ_MORE,
  MECHANIC_SIDEBAR,
} from "@/components/layout/nav-config";

export function AppNav({
  items,
  current,
  more,
  className,
}: {
  items: { href: string; label: string }[];
  current: string;
  more?: { href: string; label: string }[];
  className?: string;
}) {
  const extra = more ?? [];
  return (
    <nav className={cn("mb-6 overflow-x-auto rounded-2xl border border-line bg-card px-2 py-2", className)} aria-label="Section">
      <div className="flex min-w-max items-center gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-medium",
              current === item.href || (item.href !== "/mechanic" && item.href !== "/admin" && current.startsWith(`${item.href}/`))
                ? "bg-accent text-white"
                : "text-muted hover:bg-slate hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        ))}
        {extra.length ? (
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-full px-3 py-2 text-sm font-medium text-muted hover:bg-slate hover:text-ink">
              More
            </summary>
            <div className="absolute right-0 z-30 mt-2 min-w-52 rounded-2xl border border-line bg-card p-2 shadow-[var(--shadow)]">
              {extra.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 text-sm text-muted hover:bg-slate hover:text-ink">
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </nav>
  );
}

export function CustomerAppNav({ current }: { current: string }) {
  return <AppNav items={CUSTOMER_NAV} more={CUSTOMER_MORE} current={current} className="lg:hidden" />;
}

export function MechanicAppNav({ current }: { current: string }) {
  return <AppNav items={MECHANIC_NAV} more={MECHANIC_MORE} current={current} />;
}

export function HqAppNav({ current }: { current: string }) {
  return <AppNav items={HQ_NAV} more={HQ_MORE} current={current} />;
}

export { CUSTOMER_NAV, CUSTOMER_MORE, MECHANIC_NAV, MECHANIC_MORE, ADMIN_NAV, HQ_NAV, HQ_MORE, MECHANIC_SIDEBAR };
