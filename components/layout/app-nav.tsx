import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppNav({
  items,
  current,
}: {
  items: { href: string; label: string }[];
  current: string;
}) {
  return (
    <nav className="mb-6 overflow-x-auto rounded-2xl border border-line bg-card px-2 py-2">
      <div className="flex min-w-max gap-1">
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
      </div>
    </nav>
  );
}

export { CUSTOMER_NAV, MECHANIC_NAV, ADMIN_NAV, HQ_NAV, MECHANIC_SIDEBAR } from "@/components/layout/nav-config";
