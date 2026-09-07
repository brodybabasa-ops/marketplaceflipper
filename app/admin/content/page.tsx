import { HqAppNav } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { staffRoles } from "@/lib/permissions";

export const metadata = { title: "Content" };

export default async function HqContentPage() {
  await requireSession(staffRoles());
  return (
    <div>
      <HqAppNav current="/admin/content" />
      <h1 className="text-3xl font-bold text-ink">Content</h1>
      <p className="mt-2 text-sm text-muted">
        Meet the Mechanic, shop tours, and spotlights live here. Content participation never determines verification.
      </p>
      <Card className="mt-6 p-5">
        <p className="text-sm text-muted">No published features yet. Architecture is ready for articles, videos, and provider spotlights.</p>
      </Card>
    </div>
  );
}
