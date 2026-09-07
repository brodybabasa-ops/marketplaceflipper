export function isVisionDemoEnabled() {
  if (process.env.PM_VISION_DEMO === "false") return false;
  if (process.env.PM_VISION_DEMO === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function isDevPreviewEnabled() {
  return isVisionDemoEnabled() && process.env.NODE_ENV !== "production";
}

export const VISION_BANNER =
  "Development fixture — not production intelligence. Disable with PM_VISION_DEMO=false.";

export const DEMO_ACCOUNTS = [
  { email: "customer@demo.pocketmechanic.app", label: "Customer", role: "CUSTOMER", home: "/home" },
  { email: "mechanic@demo.pocketmechanic.app", label: "Mobile provider", role: "MECHANIC", home: "/mechanic" },
  { email: "sarah.chen@demo.pocketmechanic.app", label: "Shop provider", role: "MECHANIC", home: "/mechanic" },
  { email: "fleet@demo.pocketmechanic.app", label: "Fleet manager", role: "CUSTOMER", home: "/fleet" },
  { email: "admin@demo.pocketmechanic.app", label: "HQ admin", role: "ADMIN", home: "/admin" },
  { email: "inspector@demo.pocketmechanic.app", label: "Inspector", role: "INSPECTOR", home: "/admin/verification" },
  { email: "support@demo.pocketmechanic.app", label: "Support", role: "SUPPORT", home: "/admin" },
  { email: "finance@demo.pocketmechanic.app", label: "Finance", role: "FINANCE", home: "/admin/payments" },
] as const;
