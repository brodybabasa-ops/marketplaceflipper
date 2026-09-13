import { NotificationsInbox } from "@/components/notifications/inbox";
import { ThemedBoard } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { listNotifications } from "@/services/notifications";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await requireSession();
  const notifications = await listNotifications(session.id);
  return (
    <ThemedBoard
      eyebrow="INBOX"
      title="Your"
      accent="Alerts."
      subtitle="Job updates, estimates, and appointment changes."
      script="Stay in the Loop."
      image="/landing/dashboard-hero.png"
      wide={false}
    >
      <NotificationsInbox notifications={notifications} />
    </ThemedBoard>
  );
}
