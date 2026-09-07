import { AppNav, MECHANIC_NAV } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";

export const metadata = { title: "Help" };

export default async function MechanicHelpPage() {
  await requireSession("MECHANIC");
  return (
    <div>
      <AppNav items={MECHANIC_NAV} current="/mechanic/help" />
      <h1 className="text-3xl font-bold text-ink">Help</h1>
      <Card className="mt-6 space-y-3 p-5 text-sm text-muted">
        <p>Pocket Mechanic sends you customers and gives you the job, estimate, and follow-up tools to complete the work.</p>
        <p>Verification is an in-person evaluation. It cannot be purchased. Founding status is separate from Verified.</p>
        <p>Customers approve or decline each repair group. Additional work needs a supplemental estimate.</p>
      </Card>
    </div>
  );
}
