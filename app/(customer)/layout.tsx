import { getSession } from "@/lib/session";
import { getCustomerChrome } from "@/services/customer-dashboard";
import { CustomerShell } from "@/components/layout/customer-shell";
import { LANDING_LOCATION } from "@/lib/landing";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") return children;
  const chrome = await getCustomerChrome(session.id);
  return (
    <CustomerShell
      user={session}
      location={chrome.location ?? LANDING_LOCATION}
      unreadMessages={chrome.unreadMessages}
      unreadNotifications={chrome.unreadNotifications}
    >
      {children}
    </CustomerShell>
  );
}
