import type { UserRole } from "@prisma/client";

export const CUSTOMER_NAV = [
  { href: "/home", label: "Home" },
  { href: "/vehicles", label: "Garage" },
  { href: "/intake", label: "Get Help" },
  { href: "/mechanics", label: "Find a Mechanic" },
  { href: "/jobs", label: "Jobs" },
  { href: "/estimates", label: "Estimates" },
  { href: "/saved", label: "Saved" },
  { href: "/messages", label: "Messages" },
  { href: "/history", label: "History" },
  { href: "/account", label: "Profile" },
];

export const MECHANIC_NAV = [
  { href: "/mechanic", label: "Dashboard" },
  { href: "/mechanic/requests", label: "Requests" },
  { href: "/mechanic/board", label: "Job Board" },
  { href: "/mechanic/schedule", label: "Schedule" },
  { href: "/mechanic/messages", label: "Messages" },
  { href: "/mechanic/customers", label: "Customers" },
  { href: "/mechanic/estimates", label: "Estimates" },
  { href: "/mechanic/earnings", label: "Payments" },
  { href: "/mechanic/analytics", label: "Performance" },
  { href: "/mechanic/profile", label: "Profile" },
  { href: "/mechanic/assurance", label: "Pocket Assurance" },
  { href: "/mechanic/settings", label: "Settings" },
  { href: "/mechanic/help", label: "Help" },
];

export const MECHANIC_SIDEBAR = MECHANIC_NAV;

export const HQ_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/marketplace", label: "Marketplace" },
  { href: "/admin/industries", label: "Industries" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/mechanics", label: "Providers" },
  { href: "/admin/verification", label: "Verification" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/disputes", label: "Pocket Assurance" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/reviews", label: "Reviews & Trust" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/growth", label: "Growth" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "System" },
];

export const ADMIN_NAV = HQ_NAV;

export function hqNavFor(role: UserRole) {
  if (role === "ADMIN") return HQ_NAV;
  if (role === "INSPECTOR") {
    return HQ_NAV.filter((item) => ["/admin", "/admin/mechanics", "/admin/verification", "/admin/jobs"].includes(item.href));
  }
  if (role === "FINANCE") {
    return HQ_NAV.filter((item) => ["/admin", "/admin/jobs", "/admin/payments", "/admin/analytics"].includes(item.href));
  }
  if (role === "SUPPORT") {
    return HQ_NAV.filter((item) =>
      ["/admin", "/admin/marketplace", "/admin/customers", "/admin/mechanics", "/admin/jobs", "/admin/disputes", "/admin/support"].includes(item.href),
    );
  }
  return HQ_NAV;
}

