import { AppNav, MECHANIC_NAV } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";

export const metadata = { title: "Settings" };

export default async function MechanicSettingsPage() {
  await requireSession("MECHANIC");
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <AppNav items={MECHANIC_NAV} current="/mechanic/settings" />
      <h1 className="text-3xl font-bold text-navy">Settings</h1>
      <Card className="mt-6 p-5 text-sm text-muted">
        Notification preferences, SMS (Twilio), and Stripe Connect onboarding will plug into this screen. Email and SMS currently use adapter services that log in development until keys are provided.
      </Card>
    </div>
  );
}
