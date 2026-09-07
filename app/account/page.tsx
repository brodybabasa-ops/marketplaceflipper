import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Profile" };

export default async function AccountPage() {
  const session = await requireSession();
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {session.role === "CUSTOMER" ? <AppNav items={CUSTOMER_NAV} current="/account" /> : null}
      <h1 className="text-3xl font-bold text-navy">Profile</h1>
      <Card className="mt-6 p-5">
        <p className="font-semibold text-navy">
          {session.firstName} {session.lastName}
        </p>
        <p className="text-sm text-muted">{session.email}</p>
        <p className="mt-2 text-sm capitalize text-muted">{session.role.toLowerCase()}</p>
        <form action={signOutAction} className="mt-6">
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </Card>
    </div>
  );
}
