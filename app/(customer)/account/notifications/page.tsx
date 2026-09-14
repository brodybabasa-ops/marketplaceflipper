import { SettingsStub } from "@/components/customer-app/settings-stub";
import { requireSession } from "@/lib/guards";

export const metadata = { title: "Notification settings" };

export default async function AccountNotificationsPage() {
  await requireSession("CUSTOMER");
  return (
    <SettingsStub
      title="Notifications"
      body="Choose what you want to hear about. In-app alerts for repairs, appointments, and messages are on. Email and SMS stay mocked in this demo."
    />
  );
}
