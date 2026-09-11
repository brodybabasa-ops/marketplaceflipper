import Link from "next/link";
import { EmptyState } from "@/components/ui/card";
import { ReviewCard } from "@/components/jobs/review-card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Reviews" };

export default async function CustomerReviewsPage() {
  const session = await requireSession("CUSTOMER");
  const reviews = await prisma.review.findMany({
    where: { customerId: session.id },
    include: {
      mechanic: true,
      job: { include: { vehicle: { include: { make: true, model: true } } } },
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold text-navy">Reviews</h1>
      <p className="mt-2 text-sm text-muted">Reviews can only come from completed Pocket Mechanic jobs.</p>
      <div className="mt-6 space-y-3">
        {reviews.length === 0 ? (
          <EmptyState title="No reviews yet" body="After a job is completed, you can leave a review from the job page." />
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-line bg-white p-4">
              <p className="text-sm font-semibold text-navy">{review.mechanic.businessName}</p>
              <p className="mb-3 text-xs text-muted">
                {review.job.vehicle.year} {review.job.vehicle.make.name} {review.job.vehicle.model.name}
              </p>
              <ReviewCard review={review} />
              <Link href={`/jobs/${review.jobId}`} className="mt-3 inline-block text-sm font-semibold text-[#2f7bff]">
                View job
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
