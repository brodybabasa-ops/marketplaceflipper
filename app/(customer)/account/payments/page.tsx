import { SettingsStub } from "@/components/customer-app/settings-stub";
import { requireSession } from "@/lib/guards";

export const metadata = { title: "Payment methods" };

export default async function AccountPaymentsPage() {
  await requireSession("CUSTOMER");
  return (
    <SettingsStub
      title="Payment Methods"
      body="Cards, financing, and payouts stay mocked until a processor is connected. You can still pay invoices on a completed repair with the demo checkout."
    />
  );
}
