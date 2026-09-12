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
    <nav className="sticky top-16 z-30 -mx-4 mb-6 overflow-x-auto border-b border-line bg-paper/95 px-4 backdrop-blur md:top-0 md:mx-0 md:rounded-2xl md:border md:bg-white md:px-2 md:py-2">
      <div className="flex min-w-max gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-medium",
              current === item.href || (item.href !== "/mechanic" && item.href !== "/admin" && current.startsWith(`${item.href}/`))
                ? "bg-navy text-white"
                : "text-muted hover:bg-paper hover:text-navy",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export const CUSTOMER_NAV = [
  { href: "/home", label: "Dashboard" },
  { href: "/vehicles", label: "My Vehicles" },
  { href: "/jobs", label: "My Repairs" },
  { href: "/appointments", label: "Appointments" },
  { href: "/estimates", label: "Estimates" },
  { href: "/messages", label: "Messages" },
  { href: "/saved", label: "Saved Shops" },
  { href: "/reviews", label: "Reviews" },
  { href: "/account", label: "Account Settings" },
];

export const MECHANIC_NAV = [
  { href: "/mechanic", label: "Today" },
  { href: "/mechanic/schedule", label: "Schedule" },
  { href: "/mechanic/requests", label: "Requests" },
  { href: "/mechanic/jobs", label: "Jobs" },
  { href: "/mechanic/estimates", label: "Estimates" },
  { href: "/mechanic/messages", label: "Messages" },
  { href: "/mechanic/reviews", label: "Reviews" },
  { href: "/mechanic/profile", label: "Profile" },
  { href: "/mechanic/earnings", label: "Earnings" },
  { href: "/mechanic/settings", label: "Settings" },
];

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/mechanics", label: "Shops" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/verification", label: "Verification" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
];
