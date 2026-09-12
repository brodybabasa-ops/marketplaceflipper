import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";

export const metadata = { title: "Settings" };

export default async function MechanicSettingsPage() {
  await requireSession("MECHANIC");
  return (
    <Card className="border-0 p-5 text-sm text-muted">
      Notification preferences, SMS (Twilio), and Stripe Connect onboarding will plug into this screen. Email and SMS currently use adapter services that log in development until keys are provided.
    </Card>
  );
}
