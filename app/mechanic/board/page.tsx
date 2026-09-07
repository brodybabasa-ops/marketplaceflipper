import Link from "next/link";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { Badge } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { jobAssetLabel } from "@/lib/asset-display";
import type { JobStatus } from "@prisma/client";

export const metadata = { title: "Job board" };

const COLUMNS: { key: JobStatus[]; label: string }[] = [
  { key: ["REQUESTED", "ACCEPTED"], label: "New requests" },
  { key: ["SCHEDULED", "EN_ROUTE"], label: "Scheduled" },
  { key: ["ARRIVED", "CHECKED_IN"], label: "Checked in" },
  { key: ["DIAGNOSING"], label: "Diagnosing" },
  { key: ["AWAITING_APPROVAL"], label: "Waiting approval" },
  { key: ["IN_PROGRESS"], label: "Repairing" },
  { key: ["QUALITY_CHECK"], label: "Quality check" },
  { key: ["READY"], label: "Ready" },
  { key: ["COMPLETED"], label: "Completed" },
];

export default async function JobBoardPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id, status: { not: "CANCELLED" } },
    include: { customer: true, vehicle: { include: { make: true, model: true } }, asset: true, serviceRequest: true },
    orderBy: { updatedAt: "desc" },
    take: 120,
  });
  return (
    <div>
      <MechanicAppNav current="/mechanic/board" />
      <h1 className="text-3xl font-bold text-ink">Job board</h1>
      <p className="mt-2 text-sm text-muted">Same job truth as the customer sees. Drag-and-drop can wait — open a job to move status.</p>
      <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const items = jobs.filter((job) => column.key.includes(job.status));
          return (
            <section key={column.label} className="w-64 shrink-0 rounded-2xl border border-line bg-navy-soft p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">{column.label}</h2>
                <Badge tone="muted">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.slice(0, 8).map((job) => (
                  <Link key={job.id} href={`/mechanic/jobs/${job.id}`} className="block rounded-xl border border-line bg-card p-3">
                    <p className="text-sm font-semibold text-ink">
                      {jobAssetLabel(job)}
                    </p>
                    <p className="text-xs text-muted">
                      {job.customer.firstName} · {job.serviceRequest.problemText.slice(0, 48)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
