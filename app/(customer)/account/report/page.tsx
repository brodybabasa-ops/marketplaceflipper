import { SettingsStub } from "@/components/customer-app/settings-stub";
import { requireSession } from "@/lib/guards";

export const metadata = { title: "Report an issue" };

export default async function AccountReportPage() {
  await requireSession("CUSTOMER");
  return (
    <SettingsStub
      title="Report an Issue"
      body="Tell us about a bug or send feedback from Contact Support in Help Center. Demo reports are logged for the Pocket Mechanic team."
    />
  );
}
