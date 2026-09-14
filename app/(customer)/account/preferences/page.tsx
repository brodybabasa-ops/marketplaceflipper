import { SettingsStub } from "@/components/customer-app/settings-stub";
import { requireSession } from "@/lib/guards";

export const metadata = { title: "App preferences" };

export default async function AccountPreferencesPage() {
  await requireSession("CUSTOMER");
  return (
    <SettingsStub
      title="App Preferences"
      body="Theme is dark to match the customer app. Units stay in miles and hours. Language is English."
    />
  );
}
