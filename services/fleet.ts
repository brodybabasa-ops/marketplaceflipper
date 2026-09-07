import { prisma } from "@/lib/db";
import { evaluateMaintenance } from "@/services/maintenance";
import { formatCents } from "@/lib/money";
import { assetLabel, vehicleLabel } from "@/lib/asset-display";

export async function fleetForUser(userId: string) {
  const membership = await prisma.fleetMembership.findFirst({
    where: { userId },
    include: {
      fleet: {
        include: {
          assignments: {
            include: {
              asset: {
                include: {
                  industry: true,
                  vehicle: { include: { make: true, model: true } },
                  jobs: { where: { status: { notIn: ["COMPLETED", "CANCELLED"] } }, include: { mechanicProfile: true } },
                  repairRecords: { include: { job: true } },
                  recommendedWork: { where: { status: "OPEN" } },
                  downtimeEvents: { where: { endedAt: null } },
                },
              },
            },
          },
          downtime: { where: { endedAt: null } },
        },
      },
    },
  });
  return membership?.fleet ?? null;
}

export async function fleetDashboard(userId: string) {
  const fleet = await fleetForUser(userId);
  if (!fleet) return null;
  const rows = fleet.assignments.map((assignment) => {
    const asset = assignment.asset;
    const title = asset.vehicle ? vehicleLabel(asset.vehicle) : assetLabel(asset);
    const down = asset.downtimeEvents.length > 0 || asset.jobs.some((job) => ["DIAGNOSING", "IN_PROGRESS", "AWAITING_APPROVAL"].includes(job.status));
    const maintenance = evaluateMaintenance({
      industryKey: asset.industry.key,
      usageValue: asset.usageValue,
      usageUnit: asset.usageUnit,
      createdAt: asset.createdAt,
    });
    const due = maintenance.filter((item) => item.status === "DUE" || item.status === "OVERDUE" || item.status === "DUE_SOON");
    const spend = asset.repairRecords.reduce((sum, item) => sum + item.job.totalCents, 0);
    return {
      assignmentId: assignment.id,
      assetId: asset.id,
      label: assignment.label,
      title,
      industry: asset.industry.name,
      down,
      activeRepairs: asset.jobs.length,
      due: due.length,
      spend,
      provider: asset.jobs[0]?.mechanicProfile.businessName ?? null,
    };
  });
  const ytd = rows.reduce((sum, item) => sum + item.spend, 0);
  return {
    fleet,
    rows,
    kpis: {
      assets: rows.length,
      needService: rows.filter((item) => item.due > 0 || item.activeRepairs > 0).length,
      down: rows.filter((item) => item.down).length,
      due: rows.reduce((sum, item) => sum + item.due, 0),
      ytdLabel: formatCents(ytd),
      avgCost: rows.length ? formatCents(Math.round(ytd / rows.length)) : formatCents(0),
    },
  };
}
