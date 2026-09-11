import { ReviewCard } from "@/components/jobs/review-card";
import { EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Reviews" };

export default async function MechanicReviewsPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const reviews = await prisma.review.findMany({
    where: { mechanicProfileId: profile.id, hidden: false },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" body="Completed jobs can be reviewed by the customer who booked them." />
      ) : (
        reviews.map((review) => <ReviewCard key={review.id} review={review} />)
      )}
    </div>
  );
}
