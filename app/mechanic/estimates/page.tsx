import { ShopEstimatesBoard } from "@/components/shop-os/estimates-view";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { estimateExpired, percentDelta } from "@/lib/shop-os";
import { addDenverDays, startOfDenverDay } from "@/lib/datetime";

export const metadata = { title: "Estimates" };

export default async function MechanicEstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; id?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { q, tab: tabParam, id } = await searchParams;
  const tab = (["all", "pending", "approved", "declined", "expired"].includes(tabParam ?? "") ? tabParam : "all") as
    | "all"
    | "pending"
    | "approved"
    | "declined"
    | "expired";
  const estimates = await prisma.estimate.findMany({
    where: { mechanicId: session.id },
    include: {
      lineItems: true,
      job: {
        include: {
          customer: true,
          vehicle: { include: { make: true, model: true } },
          serviceRequest: true,
          thread: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const term = q?.trim().toLowerCase();
  const searched = term
    ? estimates.filter((estimate) => {
        const hay = `${estimate.job.customer.firstName} ${estimate.job.customer.lastName} ${estimate.job.vehicle.make.name} ${estimate.job.vehicle.model.name} ${estimate.job.serviceRequest.problemText}`.toLowerCase();
        return hay.includes(term);
      })
    : estimates;
  const pending = estimates.filter((item) => item.status === "SENT" && !estimateExpired(item.sentAt, item.status));
  const approved = estimates.filter((item) => item.status === "APPROVED");
  const declined = estimates.filter((item) => item.status === "DECLINED");
  const expired = estimates.filter((item) => estimateExpired(item.sentAt, item.status));
  const visible =
    tab === "pending" ? pending : tab === "approved" ? approved : tab === "declined" ? declined : tab === "expired" ? expired : searched;
  const monthAgo = addDenverDays(startOfDenverDay(), -30);
  const approvedMonth = approved.filter((item) => item.createdAt >= monthAgo);
  const decidedMonth = estimates.filter((item) => item.createdAt >= monthAgo && (item.status === "APPROVED" || item.status === "DECLINED"));
  const prevMonthStart = addDenverDays(monthAgo, -30);
  const decidedPrev = estimates.filter(
    (item) => item.createdAt >= prevMonthStart && item.createdAt < monthAgo && (item.status === "APPROVED" || item.status === "DECLINED"),
  );
  const approvedPrev = estimates.filter((item) => item.createdAt >= prevMonthStart && item.createdAt < monthAgo && item.status === "APPROVED");
  const rate = decidedMonth.length ? Math.round((approvedMonth.length / decidedMonth.length) * 100) : 0;
  const prevRate = decidedPrev.length ? Math.round((approvedPrev.length / decidedPrev.length) * 100) : 0;

  return (
    <ShopEstimatesBoard
      estimates={visible}
      selectedId={id}
      tab={tab}
      q={q}
      kpis={{
        pending: pending.length,
        pendingCents: pending.reduce((sum, item) => sum + item.totalCents, 0),
        approved: approvedMonth.length,
        approvedCents: approvedMonth.reduce((sum, item) => sum + item.totalCents, 0),
        declined: declined.filter((item) => item.createdAt >= monthAgo).length,
        declinedCents: declined.filter((item) => item.createdAt >= monthAgo).reduce((sum, item) => sum + item.totalCents, 0),
        expired: expired.length,
        expiredCents: expired.reduce((sum, item) => sum + item.totalCents, 0),
        approvalRate: rate,
        approvalDelta: percentDelta(rate, prevRate),
      }}
    />
  );
}
