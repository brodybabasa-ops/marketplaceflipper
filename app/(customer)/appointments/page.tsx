import type { JobStatus } from "@prisma/client";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatAppointmentDate, formatAppointmentTime } from "@/lib/datetime";
import { vehiclePhotoFor } from "@/lib/landing";
import { CustomerAppointmentsView, type AppointmentRow } from "@/components/customer-app/appointments-view";

export const metadata = { title: "Appointments" };

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireSession("CUSTOMER");
  const { tab } = await searchParams;
  const jobs = await prisma.job.findMany({
    where: { customerId: session.id },
    include: { mechanicProfile: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
    orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
  });

  const now = Date.now();
  const rows: AppointmentRow[] = jobs.map((job) => {
    const upcoming = Boolean(job.scheduledAt && job.scheduledAt.getTime() >= now && job.status !== "COMPLETED" && job.status !== "CANCELLED");
    const canceled = job.status === "CANCELLED";
    const group = canceled ? "canceled" : upcoming ? "upcoming" : "past";
    return {
      id: job.id,
      href: `/jobs/${job.id}#appointment`,
      calendarHref: job.scheduledAt ? `/jobs/${job.id}/calendar` : null,
      vehicleLabel: `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`,
      problem: job.serviceRequest.problemText,
      shopName: job.mechanicProfile.businessName,
      shopCity: [job.mechanicProfile.shopCity, job.mechanicProfile.shopState].filter(Boolean).join(", "),
      photo: vehiclePhotoFor(job.vehicle.make.name, job.vehicle.model.name),
      dateLine: job.scheduledAt ? formatAppointmentDate(job.scheduledAt) : "Needs a time",
      timeLine: job.scheduledAt ? formatAppointmentTime(job.scheduledAt) : "",
      status: badge(job.status, Boolean(job.scheduledAt)).label,
      tone: badge(job.status, Boolean(job.scheduledAt)).tone,
      group,
    };
  });

  const sorted = [
    ...rows.filter((row) => row.group === "upcoming"),
    ...rows.filter((row) => row.group === "past"),
    ...rows.filter((row) => row.group === "canceled"),
  ];

  return <CustomerAppointmentsView rows={sorted} tab={tab ?? "upcoming"} />;
}

function badge(status: JobStatus, scheduled: boolean) {
  if (status === "CANCELLED") return { label: "Canceled", tone: "muted" as const };
  if (status === "COMPLETED") return { label: "Completed", tone: "success" as const };
  if (status === "AWAITING_APPROVAL") return { label: "Pending", tone: "warning" as const };
  if (status === "SCHEDULED" || scheduled) return { label: "Confirmed", tone: "success" as const };
  return { label: "Scheduled", tone: "info" as const };
}
