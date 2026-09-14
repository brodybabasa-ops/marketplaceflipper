import { ShopReviewsBoard } from "@/components/shop-os/reviews-view";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { addDenverDays, startOfDenverDay } from "@/lib/datetime";

export const metadata = { title: "Reviews" };

export default async function MechanicReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; q?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { id } = await searchParams;
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const reviews = await prisma.review.findMany({
    where: { mechanicProfileId: profile.id, hidden: false },
    include: {
      customer: true,
      response: true,
      job: { include: { serviceRequest: true, vehicle: { include: { make: true, model: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const monthAgo = addDenverDays(startOfDenverDay(), -30);
  const buckets = [0, 0, 0, 0, 0];
  for (const review of reviews) {
    const index = Math.min(4, Math.max(0, review.overallRating - 1));
    buckets[index] += 1;
  }
  return (
    <ShopReviewsBoard
      reviews={reviews}
      selectedId={id}
      stats={{
        average: profile.averageRating,
        count: reviews.length,
        fiveStar: reviews.filter((item) => item.overallRating === 5).length,
        new30: reviews.filter((item) => item.createdAt >= monthAgo).length,
        buckets,
      }}
    />
  );
}
