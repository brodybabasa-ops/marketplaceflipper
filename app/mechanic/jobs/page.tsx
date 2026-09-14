import { ShopJobsBoard } from "@/components/shop-os/jobs-view";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { jobWaitingOnParts } from "@/lib/estimates";
import { shopJobTabStatuses, type ShopJobTab } from "@/lib/shop-os";
import { getJobForUser, jobSearchWhere } from "@/services/jobs";

export const metadata = { title: "Jobs / Repairs" };

export default async function MechanicJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; job?: string; panel?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { q, tab: tabParam, job: selectedId, panel } = await searchParams;
  const tab = (["all", "progress", "parts", "approval", "completed", "hold", "canceled"].includes(tabParam ?? "")
    ? tabParam
    : "all") as ShopJobTab;
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const statuses = shopJobTabStatuses(tab);
  const jobs = await prisma.job.findMany({
    where: {
      mechanicProfileId: profile.id,
      ...(statuses ? { status: { in: statuses } } : {}),
      ...jobSearchWhere(q),
    },
    include: {
      customer: true,
      vehicle: { include: { make: true, model: true } },
      serviceRequest: true,
      resource: true,
      estimates: { include: { lineItems: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const visible =
    tab === "parts"
      ? jobs.filter((job) => jobWaitingOnParts(job.status, job.estimates.flatMap((item) => item.lineItems)))
      : jobs;

  const allForCounts = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id },
    include: { estimates: { include: { lineItems: true } } },
  });
  const counts = {
    all: allForCounts.length,
    progress: allForCounts.filter((job) =>
      ["ACCEPTED", "SCHEDULED", "EN_ROUTE", "ARRIVED", "DIAGNOSING", "IN_PROGRESS"].includes(job.status),
    ).length,
    parts: allForCounts.filter((job) => jobWaitingOnParts(job.status, job.estimates.flatMap((item) => item.lineItems))).length,
    approval: allForCounts.filter((job) => job.status === "AWAITING_APPROVAL").length,
    completed: allForCounts.filter((job) => job.status === "COMPLETED").length,
    hold: allForCounts.filter((job) => job.status === "DISPUTED").length,
    canceled: allForCounts.filter((job) => job.status === "CANCELLED").length,
  };

  const selected = selectedId ? await getJobForUser(selectedId, session.id, session.role) : visible[0] ? await getJobForUser(visible[0].id, session.id, session.role) : null;

  return (
    <ShopJobsBoard
      jobs={visible}
      counts={counts}
      tab={tab}
      selectedId={selected?.id}
      selected={selected}
      panel={panel}
      q={q}
      sessionId={session.id}
    />
  );
}
