import type { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatAppointmentDate } from "@/lib/datetime";
import { vehiclePhotoFor } from "@/lib/landing";
import { formatCents } from "@/lib/money";
import { formatBoardDate } from "@/lib/utils";
import { usesHours, vehicleKind, type VehicleKind } from "@/lib/vehicles";

export type GarageBadgeTone = "danger" | "warning" | "info" | "success" | "muted";

export type GarageVehicle = {
  id: string;
  href: string;
  editHref: string;
  requestHref: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  subtitle: string;
  identifierLabel: "VIN" | "HIN";
  identifier: string;
  usage: string;
  photo: string;
  kind: VehicleKind;
  badges: { label: string; tone: GarageBadgeTone }[];
  lastServiceLabel: string;
  lastServiceValue: string;
  nextServiceLabel: string;
  nextServiceValue: string;
  photoClass?: string;
  primary?: boolean;
  copyable?: boolean;
  status?: "ok" | "due";
  statusLabel?: string;
};

export type GarageMaintenance = {
  href: string;
  vehicleLabel: string;
  service: string;
  due: string;
  dueTone: "normal" | "urgent";
  date: string;
  photo: string;
};

export type GarageInsights = {
  vehicles: number;
  servicesCompleted: number;
  totalMaintenance: string;
  openRecalls: number;
};

const ACTIVE: JobStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "SCHEDULED",
  "EN_ROUTE",
  "ARRIVED",
  "DIAGNOSING",
  "AWAITING_APPROVAL",
  "IN_PROGRESS",
  "DISPUTED",
];

export async function getCustomerGarage(userId: string) {
  const records = await prisma.vehicle.findMany({
    where: { customerId: userId, archivedAt: null },
    include: {
      make: true,
      model: true,
      jobs: {
        include: { serviceRequest: true, mechanicProfile: true, repairRecord: true },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const vehicles: GarageVehicle[] = records.map((vehicle) => {
    const activeJobs = vehicle.jobs.filter((job) => ACTIVE.includes(job.status));
    const lastDone = vehicle.jobs.find((job) => job.status === "COMPLETED");
    const upcoming = vehicle.jobs
      .filter((job) => job.scheduledAt && job.status !== "CANCELLED" && job.status !== "COMPLETED")
      .sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime())[0];
    const kind = vehicleKind(vehicle.make.name, vehicle.model.name);
    const hours = usesHours(vehicle.make.name, vehicle.model.name);
    const identifier = vehicle.vin?.trim() || "Not on file";
    const badges = garageBadges(activeJobs.length, upcoming, lastDone?.completedAt ?? lastDone?.updatedAt ?? null, hours);
    const next = nextService(vehicle.mileage, hours, kind, upcoming?.scheduledAt ?? null, lastDone?.completedAt ?? null);

    return {
      id: vehicle.id,
      href: `/vehicles/${vehicle.id}/edit`,
      editHref: `/vehicles/${vehicle.id}/edit`,
      requestHref: `/request?vehicle=${vehicle.id}`,
      year: vehicle.year,
      make: vehicle.make.name,
      model: vehicle.model.name,
      trim: vehicle.trim ?? "",
      subtitle: [vehicle.make.name, vehicle.model.name, vehicle.engine || vehicle.trim].filter(Boolean).join(" · "),
      identifierLabel: hours && kind === "marine" ? "HIN" : "VIN",
      identifier,
      usage: hours ? `${vehicle.mileage.toLocaleString()} hrs` : `${vehicle.mileage.toLocaleString()} mi`,
      photo: vehiclePhotoFor(vehicle.make.name, vehicle.model.name),
      kind,
      badges,
      lastServiceLabel: "Last Service",
      lastServiceValue: lastDone ? formatBoardDate(lastDone.completedAt ?? lastDone.updatedAt) : "—",
      nextServiceLabel: next.label,
      nextServiceValue: next.value,
    };
  });

  const maintenance: GarageMaintenance[] = records
    .flatMap((vehicle) => {
      const photo = vehiclePhotoFor(vehicle.make.name, vehicle.model.name);
      const vehicleLabel = `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`;
      const upcoming = vehicle.jobs
        .filter((job) => job.scheduledAt && job.status !== "CANCELLED" && job.status !== "COMPLETED")
        .sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime());
      const nextJob = upcoming[0];
      const when = nextJob?.scheduledAt;
      if (nextJob && when) {
        const soon = when.getTime() - Date.now() < 1000 * 60 * 60 * 48;
        return [
          {
            href: `/jobs/${nextJob.id}#appointment`,
            vehicleLabel,
            service: nextJob.serviceRequest.problemText,
            due: formatAppointmentDate(when),
            dueTone: soon ? ("urgent" as const) : ("normal" as const),
            date: nextJob.mechanicProfile.businessName,
            photo,
          },
        ];
      }
      return [];
    })
    .slice(0, 8);

  const allJobs = records.flatMap((vehicle) => vehicle.jobs);
  const completed = allJobs.filter((job) => job.status === "COMPLETED");
  const insights: GarageInsights = {
    vehicles: records.length,
    servicesCompleted: completed.length,
    totalMaintenance: formatCents(completed.reduce((sum, job) => sum + job.totalCents, 0)),
    openRecalls: 0,
  };

  const counts = {
    all: vehicles.length,
    auto: vehicles.filter((item) => item.kind === "auto").length,
    marine: vehicles.filter((item) => item.kind === "marine").length,
    powersports: vehicles.filter((item) => item.kind === "powersports").length,
    rv: vehicles.filter((item) => item.kind === "rv").length,
  };

  return { vehicles, maintenance, insights, counts };
}

function garageBadges(
  activeCount: number,
  upcoming: { scheduledAt: Date | null } | undefined,
  lastDoneAt: Date | null,
  hours: boolean,
) {
  const badges: { label: string; tone: GarageBadgeTone }[] = [];
  if (activeCount > 0) {
    badges.push({
      label: `${activeCount} Active Repair${activeCount === 1 ? "" : "s"}`,
      tone: "success",
    });
  }
  if (upcoming?.scheduledAt) {
    badges.push({ label: "1 Upcoming Service", tone: "info" });
  }
  const stale = lastDoneAt ? Date.now() - lastDoneAt.getTime() > 1000 * 60 * 60 * 24 * 120 : !lastDoneAt;
  if (stale && !upcoming) {
    badges.push({ label: hours ? "Service Due" : "Service Due Soon", tone: "warning" });
  }
  if (!badges.length) {
    badges.push({ label: "All Good", tone: "success" });
    badges.push({ label: "No Service Due", tone: "muted" });
  } else if (!stale && upcoming) {
    badges.push({ label: "All Good", tone: "success" });
  }
  return badges.slice(0, 2);
}

function nextService(
  mileage: number,
  hours: boolean,
  kind: VehicleKind,
  scheduledAt: Date | null,
  lastDoneAt: Date | null,
) {
  if (scheduledAt) {
    return { label: "Next Service", value: formatAppointmentDate(scheduledAt) };
  }
  if (hours) {
    const next = Math.ceil((mileage + 1) / 50) * 50;
    return { label: "Next Service", value: `At ${next} Hours` };
  }
  if (kind === "rv") {
    return { label: "Next Service", value: lastDoneAt ? "In 6 Months" : "No Service Due" };
  }
  const nextMiles = Math.ceil((mileage + 1) / 5000) * 5000;
  const remaining = Math.max(0, nextMiles - mileage);
  return { label: "Next Service", value: remaining === 0 ? "Due now" : `In ${remaining.toLocaleString()} miles` };
}
