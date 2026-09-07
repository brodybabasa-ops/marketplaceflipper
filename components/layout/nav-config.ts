import type { UserRole } from "@prisma/client";

export const CUSTOMER_NAV = [
  { href: "/home", label: "Home" },
  { href: "/vehicles", label: "Garage" },
  { href: "/fix", label: "Fix It" },
  { href: "/jobs", label: "Jobs" },
];

export const CUSTOMER_MORE = [
  { href: "/inspect", label: "Inspect before buying" },
  { href: "/help-now", label: "Urgent help" },
  { href: "/estimates", label: "Estimates" },
  { href: "/messages", label: "Messages" },
  { href: "/history", label: "History" },
  { href: "/fleet", label: "Fleet" },
  { href: "/wallet", label: "Wallet" },
  { href: "/account", label: "Profile" },
];

export const MECHANIC_NAV = [
  { href: "/mechanic", label: "Attention" },
  { href: "/mechanic/requests", label: "Requests" },
  { href: "/mechanic/jobs", label: "Jobs" },
  { href: "/mechanic/customers", label: "Customers" },
  { href: "/mechanic/schedule", label: "Schedule" },
  { href: "/mechanic/earnings", label: "Payments" },
];

export const MECHANIC_MORE = [
  { href: "/mechanic/board", label: "Job board" },
  { href: "/mechanic/messages", label: "Messages" },
  { href: "/mechanic/estimates", label: "Estimates" },
  { href: "/mechanic/analytics", label: "Performance" },
  { href: "/mechanic/profile", label: "Profile" },
  { href: "/mechanic/assurance", label: "Pocket Assurance" },
  { href: "/mechanic/settings", label: "Settings" },
  { href: "/mechanic/help", label: "Help" },
];

export const MECHANIC_SIDEBAR = [...MECHANIC_NAV, ...MECHANIC_MORE];

export const HQ_NAV = [
  { href: "/admin", label: "Attention" },
  { href: "/admin/marketplace", label: "Marketplace" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/mechanics", label: "Providers" },
  { href: "/admin/verification", label: "Verification" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/disputes", label: "Pocket Assurance" },
];

export const HQ_MORE = [
  { href: "/admin/recruiting", label: "Providers needed" },
  { href: "/admin/industries", label: "Industries" },
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
  const all = [...HQ_NAV, ...HQ_MORE];
  if (role === "ADMIN") return all;
  if (role === "INSPECTOR") {
    return all.filter((item) => ["/admin", "/admin/mechanics", "/admin/verification", "/admin/jobs"].includes(item.href));
  }
  if (role === "FINANCE") {
    return all.filter((item) => ["/admin", "/admin/jobs", "/admin/payments", "/admin/analytics"].includes(item.href));
  }
  if (role === "SUPPORT") {
    return all.filter((item) =>
      ["/admin", "/admin/marketplace", "/admin/customers", "/admin/mechanics", "/admin/jobs", "/admin/disputes", "/admin/support"].includes(item.href),
    );
  }
  return all;
}
