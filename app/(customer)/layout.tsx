import { getSession } from "@/lib/session";
import { getCustomerChrome } from "@/services/customer-dashboard";
import { CustomerAppShell } from "@/components/customer-app/shell";
import { LANDING_LOCATION } from "@/lib/landing";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") return children;
  const chrome = await getCustomerChrome(session.id);
  return (
    <CustomerAppShell
      user={session}
      location={chrome.location ?? LANDING_LOCATION}
      unreadMessages={chrome.unreadMessages}
      unreadNotifications={chrome.unreadNotifications}
      avatarUrl={chrome.avatarUrl}
    >
      {children}
    </CustomerAppShell>
  );
}
