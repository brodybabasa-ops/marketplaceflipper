import Link from "next/link";
import { CustomerAppNav } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { signOutAction } from "@/app/actions/auth";
import { updateNotificationPrefsAction } from "@/app/actions/phase2";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";

export const metadata = { title: "Profile" };

export default async function AccountPage() {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {session.role === "CUSTOMER" ? <CustomerAppNav current="/account" /> : null}
      <h1 className="text-3xl font-bold text-ink">Profile</h1>
      <Card className="mt-6 p-5">
        <p className="font-semibold text-ink">
          {session.firstName} {session.lastName}
        </p>
        <p className="text-sm text-muted">{session.email}</p>
        <p className="mt-2 text-sm capitalize text-muted">{session.role.toLowerCase()}</p>
        {session.role === "CUSTOMER" ? (
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-ink">
            <Link href="/saved">Saved mechanics</Link>
            <Link href="/disputes">Disputes</Link>
            <Link href="/history">Repair history</Link>
          </div>
        ) : null}
      </Card>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">Notifications</h2>
        <p className="mt-1 text-sm text-muted">
          In-app is always on. Email uses Resend when configured; otherwise it is logged. SMS uses Twilio when credentials
          are set.
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
      <form action={signOutAction} className="mt-6">
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </div>
  );
}
