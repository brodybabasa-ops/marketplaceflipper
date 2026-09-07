import { AppNav, MECHANIC_NAV } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { updateNotificationPrefsAction } from "@/app/actions/phase2";

export const metadata = { title: "Settings" };

export default async function MechanicSettingsPage() {
  const session = await requireSession("MECHANIC");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
  const profile = await prisma.mechanicProfile.findUnique({ where: { userId: session.id } });
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <AppNav items={MECHANIC_NAV} current="/mechanic/settings" />
      <h1 className="text-3xl font-bold text-ink">Settings</h1>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">Subscription</h2>
        {profile?.subscriptionFeeWaived ? (
          <p className="mt-2 text-sm text-muted">
            Pocket Mechanic PRO subscription is waived
            {profile.isFoundingProvider ? ` for Founding Mechanic #${String(profile.foundingNumber).padStart(3, "0")}` : ""}.
            Marketplace transaction fees still apply unless separately waived.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">Pocket Mechanic PRO is $49/month. Marketplace jobs also include a platform transaction fee.</p>
        )}
      </Card>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">Notifications</h2>
        <p className="mt-1 text-sm text-muted">
          In-app is always on. Email uses Resend when `RESEND_API_KEY` is set; otherwise it is logged. SMS uses Twilio when
          account credentials are set.
        </p>
        <form action={updateNotificationPrefsAction} className="mt-4 space-y-3">
          <Field label="Mobile number for SMS">
            <Input name="phone" defaultValue={user.phone ?? ""} placeholder="+1 801 555 0100" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="emailNotifications" defaultChecked={user.emailNotifications} />
            Email notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="smsNotifications" defaultChecked={user.smsNotifications} />
            SMS notifications (Twilio)
          </label>
          <Button type="submit">Save preferences</Button>
        </form>
      </Card>
    </div>
  );
}
