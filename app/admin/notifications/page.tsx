import { NotificationsInbox } from "@/components/notifications/inbox";
import { requireSession } from "@/lib/guards";
import { listNotifications } from "@/services/notifications";

export const metadata = { title: "Inbox" };

export default async function AdminNotificationsPage() {
  const session = await requireSession("ADMIN");
  const notifications = await listNotifications(session.id);
  return <NotificationsInbox notifications={notifications} />;
}
