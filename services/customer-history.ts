import { prisma } from "@/lib/db";
import { shopPhotoFor, vehiclePhotoFor } from "@/lib/landing";
import { historyMonthKey } from "@/lib/customer-app";
import { formatCents } from "@/lib/money";
import { formatBoardDate } from "@/lib/utils";
import { vehicleKind, type VehicleKind } from "@/lib/vehicles";

export type HistoryRow = {
  id: string;
  jobId: string;
  href: string;
  invoiceHref: string;
  vehicleLabel: string;
  problem: string;
  shopName: string;
  shopPhoto: string;
  photo: string;
  kind: VehicleKind;
  date: Date;
  dateLabel: string;
  month: string;
  cost: string;
  labor: string;
};

export async function getCustomerHistory(userId: string) {
  const records = await prisma.repairRecord.findMany({
    where: { vehicle: { customerId: userId, archivedAt: null } },
    include: {
      vehicle: { include: { make: true, model: true } },
      job: {
        include: {
          mechanicProfile: true,
          serviceRequest: true,
          estimates: { include: { lineItems: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const completedJobs = await prisma.job.findMany({
    where: {
      customerId: userId,
      status: "COMPLETED",
      repairRecord: { is: null },
    },
    include: {
      vehicle: { include: { make: true, model: true } },
      mechanicProfile: true,
      serviceRequest: true,
      estimates: { include: { lineItems: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  const fromRecords: HistoryRow[] = records.map((record) => {
    const laborHours =
      record.laborHours ??
      record.job.estimates
        .flatMap((estimate) => estimate.lineItems)
        .filter((item) => item.category === "LABOR")
        .reduce((sum, item) => sum + item.quantity, 0);
    const kind = vehicleKind(record.vehicle.make.name, record.vehicle.model.name);
    const date = record.createdAt;
    return {
      id: record.id,
      jobId: record.jobId,
      href: `/jobs/${record.jobId}`,
      invoiceHref: `/jobs/${record.jobId}#invoice`,
      vehicleLabel: `${record.vehicle.year} ${record.vehicle.make.name} ${record.vehicle.model.name}`,
      problem: record.title || record.job.serviceRequest.problemText,
      shopName: record.job.mechanicProfile.businessName,
      shopPhoto: shopPhotoFor(record.job.mechanicProfile.slug),
      photo: vehiclePhotoFor(record.vehicle.make.name, record.vehicle.model.name),
      kind,
      date,
      dateLabel: formatBoardDate(date),
      month: historyMonthKey(date),
      cost: formatCents(record.job.totalCents),
      labor: laborHours ? `${Number(laborHours).toFixed(laborHours % 1 ? 1 : 0)} hrs` : "—",
    };
  });

  const fromJobs: HistoryRow[] = completedJobs.map((job) => {
    const laborHours = job.estimates
      .flatMap((estimate) => estimate.lineItems)
      .filter((item) => item.category === "LABOR")
      .reduce((sum, item) => sum + item.quantity, 0);
    const date = job.completedAt ?? job.updatedAt;
    const kind = vehicleKind(job.vehicle.make.name, job.vehicle.model.name);
    return {
      id: job.id,
      jobId: job.id,
      href: `/jobs/${job.id}`,
      invoiceHref: `/jobs/${job.id}#invoice`,
      vehicleLabel: `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`,
      problem: job.serviceRequest.problemText,
      shopName: job.mechanicProfile.businessName,
      shopPhoto: shopPhotoFor(job.mechanicProfile.slug),
      photo: vehiclePhotoFor(job.vehicle.make.name, job.vehicle.model.name),
      kind,
      date,
      dateLabel: formatBoardDate(date),
      month: historyMonthKey(date),
      cost: formatCents(job.totalCents),
      labor: laborHours ? `${Number(laborHours).toFixed(laborHours % 1 ? 1 : 0)} hrs` : "—",
    };
  });

  const rows = [...fromRecords, ...fromJobs].sort((a, b) => b.date.getTime() - a.date.getTime());
  const counts = {
    all: rows.length,
    auto: rows.filter((row) => row.kind === "auto").length,
    marine: rows.filter((row) => row.kind === "marine").length,
    powersports: rows.filter((row) => row.kind === "powersports").length,
    rv: rows.filter((row) => row.kind === "rv").length,
  };

  return { rows, counts };
}
