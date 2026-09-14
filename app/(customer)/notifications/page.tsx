import { CustomerNotificationsView } from "@/components/customer-app/notifications-view";
import { requireSession } from "@/lib/guards";
import { listNotifications } from "@/services/notifications";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireSession();
  const notifications = await listNotifications(session.id);
  const { tab } = await searchParams;
  return <CustomerNotificationsView notifications={notifications} tab={tab ?? "all"} />;
}
