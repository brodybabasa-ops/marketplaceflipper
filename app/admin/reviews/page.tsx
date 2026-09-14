import { Button } from "@/components/ui/button";
import { BoardRow } from "@/components/layout/themed-board";
import { hideReviewAction } from "@/app/actions/admin";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  await requireSession("ADMIN");
  const reviews = await prisma.review.findMany({
    include: { customer: true, mechanic: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <BoardRow key={review.id}>
          <p className="font-semibold text-navy">
            {review.overallRating}★ · {review.mechanic.businessName}
          </p>
          <p className="text-sm">{review.body}</p>
          <p className="mt-1 text-xs text-muted">
            {review.customer.email} {review.hidden ? "· hidden" : ""}
          </p>
          {!review.hidden ? (
            <form action={hideReviewAction} className="mt-3">
              <input type="hidden" name="reviewId" value={review.id} />
              <Button size="sm" variant="secondary">
                Hide review
              </Button>
            </form>
          ) : null}
        </BoardRow>
      ))}
    </div>
  );
}
