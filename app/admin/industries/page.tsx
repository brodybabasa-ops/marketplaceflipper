import { HqAppNav } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { staffRoles } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export const metadata = { title: "Industries" };

export default async function IndustriesHqPage() {
  await requireSession(staffRoles());
  const industries = await prisma.industry.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      assetTypes: { orderBy: { name: "asc" } },
      taxonomies: { orderBy: { sortOrder: "asc" } },
      inspectionTemplates: true,
      maintenanceRules: true,
    },
  });
  return (
    <div>
      <HqAppNav current="/admin/industries" />
      <h1 className="text-3xl font-bold text-ink">Industries & taxonomy</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Configurable catalogs — not a rebuild. Automotive remains the consumer default. Add types and inspection templates here as the network grows.
      </p>
      <div className="mt-6 space-y-4">
        {industries.map((industry) => (
          <Card key={industry.id} className="p-5">
            <h2 className="text-lg font-semibold text-ink">{industry.name}</h2>
            <p className="text-sm text-muted">{industry.intakePrompt}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Asset types</p>
            <p className="mt-1 text-sm">{industry.assetTypes.map((item) => item.name).join(" · ")}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Service taxonomy</p>
            <p className="mt-1 text-sm">{industry.taxonomies.map((item) => item.label).join(" · ")}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Inspection templates</p>
            <p className="mt-1 text-sm">
              {industry.inspectionTemplates.map((item) => `${item.name} (${item.kind})`).join(" · ") || "None yet"}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Maintenance intervals</p>
            <p className="mt-1 text-sm">
              {industry.maintenanceRules.map((item) => `${item.title} · ${item.intervalValue} ${item.intervalUnit.toLowerCase()}`).join(" · ") ||
                "None yet"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
