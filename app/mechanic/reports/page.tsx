import { ShopReportsView } from "@/components/shop-os/list-pages";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Reports" };

export default async function MechanicReportsPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const [jobs, estimates, reviews, paid] = await Promise.all([
    prisma.job.count({ where: { mechanicProfileId: profile.id } }),
    prisma.estimate.count({ where: { mechanicId: session.id } }),
    prisma.review.count({ where: { mechanicProfileId: profile.id, hidden: false } }),
    prisma.job.aggregate({
      where: { mechanicProfileId: profile.id, paymentStatus: "PAID" },
      _sum: { totalCents: true },
    }),
  ]);
  return (
    <ShopReportsView jobs={jobs} estimates={estimates} reviews={reviews} revenue={paid._sum.totalCents ?? 0} />
  );
}
