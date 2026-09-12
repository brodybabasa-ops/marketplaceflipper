import type { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatAppointmentDate } from "@/lib/datetime";
import { vehiclePhotoFor } from "@/lib/landing";
import { formatCents } from "@/lib/money";
import { formatBoardDate } from "@/lib/utils";

export type GarageVehicle = {
  id: string | null;
  href: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  identifierLabel: "VIN" | "HIN";
  identifier: string;
  copyable?: boolean;
  usage: string;
  photo: string;
  photoClass?: string;
  status: "ok" | "due";
  statusLabel: string;
  primary?: boolean;
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
    where: { customerId: userId },
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

  const vehicles: GarageVehicle[] = records.map((vehicle, index) => {
    const active = vehicle.jobs.find((job) => ACTIVE.includes(job.status));
    const lastDone = vehicle.jobs.find((job) => job.status === "COMPLETED");
    const marine = isMarine(vehicle.make.name, vehicle.model.name);
    const identifier = vehicle.vin?.trim() || "Not on file";
    const { status, statusLabel } = garageStatus(active, lastDone);

    return {
      id: vehicle.id,
      href: active ? `/jobs/${active.id}` : `/request?vehicle=${vehicle.id}`,
      year: vehicle.year,
      make: vehicle.make.name,
      model: vehicle.model.name,
      trim: [vehicle.trim, vehicle.engine].filter(Boolean).join(" · "),
      identifierLabel: marine ? "HIN" : "VIN",
      identifier,
      copyable: Boolean(vehicle.vin),
      usage: usageLabel(vehicle.make.name, vehicle.model.name, vehicle.mileage),
      photo: vehiclePhotoFor(vehicle.make.name, vehicle.model.name),
      photoClass: vehicle.make.name === "Ford" ? "object-[78%_center]" : undefined,
      status,
      statusLabel,
      primary: index === 0,
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
      const active = vehicle.jobs.find((job) => ACTIVE.includes(job.status));
      if (active) {
        return [
          {
            href: `/jobs/${active.id}#appointment`,
            vehicleLabel,
            service: active.serviceRequest.problemText,
            due: "Needs a time",
            dueTone: "urgent" as const,
            date: active.mechanicProfile.businessName,
            photo,
          },
        ];
      }
      const done = vehicle.jobs.find((job) => job.status === "COMPLETED");
      if (done) {
        return [
          {
            href: `/jobs/${done.id}`,
            vehicleLabel,
            service: done.repairRecord?.title ?? done.serviceRequest.problemText,
            due: "Complete",
            dueTone: "normal" as const,
            date: formatBoardDate(done.completedAt ?? done.updatedAt),
            photo,
          },
        ];
      }
      return [
        {
          href: `/request?vehicle=${vehicle.id}`,
          vehicleLabel,
          service: "No service on the book",
          due: "Request",
          dueTone: "normal" as const,
          date: "—",
          photo,
        },
      ];
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

  return { vehicles, maintenance, insights };
}

function garageStatus(
  active?: { status: JobStatus; scheduledAt: Date | null },
  lastDone?: { completedAt: Date | null },
) {
  if (active?.status === "IN_PROGRESS" || active?.status === "DIAGNOSING" || active?.status === "EN_ROUTE" || active?.status === "ARRIVED") {
    return { status: "due" as const, statusLabel: "In service" };
  }
  if (active?.status === "AWAITING_APPROVAL") {
    return { status: "due" as const, statusLabel: "Needs approval" };
  }
  if (active?.status === "DISPUTED") {
    return { status: "due" as const, statusLabel: "In dispute" };
  }
  if (active?.scheduledAt || active?.status === "SCHEDULED") {
    return { status: "ok" as const, statusLabel: "Appointment booked" };
  }
  if (active?.status === "REQUESTED") {
    return { status: "due" as const, statusLabel: "Request sent" };
  }
  if (active) {
    return { status: "due" as const, statusLabel: "Needs a time" };
  }
  if (lastDone) {
    return { status: "ok" as const, statusLabel: "Ready" };
  }
  return { status: "ok" as const, statusLabel: "Ready" };
}

function isMarine(make: string, model: string) {
  const hay = `${make} ${model}`.toLowerCase();
  return hay.includes("centurion") || hay.includes("yamaha") || hay.includes("boat") || hay.includes("fx cruiser");
}

function usageLabel(make: string, model: string, mileage: number) {
  const hay = `${make} ${model}`.toLowerCase();
  const hours =
    hay.includes("centurion") ||
    hay.includes("yamaha") ||
    hay.includes("ktm") ||
    hay.includes("fx cruiser") ||
    hay.includes("boat");
  return hours ? `${mileage.toLocaleString()} hrs` : `${mileage.toLocaleString()} mi`;
}
