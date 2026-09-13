import { Card } from "@/components/ui/card";
import { ShopHoursForm } from "@/components/jobs/shop-hours-form";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Settings" };

export default async function MechanicSettingsPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { availability: true },
  });
  return (
    <div className="space-y-4">
      <Card className="border-0 p-5">
        <h2 className="font-semibold text-navy">Shop hours</h2>
        <p className="mt-1 text-sm text-muted">
          These hours show on the scheduler. Closed days stay off the book.
        </p>
        <div className="mt-4">
          <ShopHoursForm hours={profile.availability} />
        </div>
      </Card>
      <Card className="border-0 p-5 text-sm text-muted">
        Shop hours above control the book. Email and SMS still log until keys are set. Payments stay on Earnings until
        Stripe Connect is connected.
      </Card>
    </div>
  );
}
