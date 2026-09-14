import { NotificationsInbox } from "@/components/notifications/inbox";
import { ShopPageHeader } from "@/components/shop-os/primitives";
import { requireSession } from "@/lib/guards";
import { listNotifications } from "@/services/notifications";

export const metadata = { title: "Inbox" };

export default async function MechanicNotificationsPage() {
  const session = await requireSession("MECHANIC");
  const notifications = await listNotifications(session.id);
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader title="Notifications" subtitle="Requests, appointments, and estimate replies." />
      <NotificationsInbox notifications={notifications} />
    </div>
  );
}
