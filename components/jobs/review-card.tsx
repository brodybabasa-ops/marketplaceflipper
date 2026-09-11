import { Rating } from "@/components/ui/rating";
import { Badge, Card } from "@/components/ui/card";
import { formatCents } from "@/lib/money";

export function ReviewCard({
  review,
}: {
  review: {
    overallRating: number;
    body: string;
    wouldUseAgain: boolean;
    repairSummary: string | null;
    priceCents: number | null;
    createdAt: Date;
    customer: { firstName: string };
  };
}) {
  return (
    <Card className="border-0 bg-[#f7f9fc] p-5 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <Rating value={review.overallRating} />
        <Badge tone="accent">Verified Pocket Mechanic Job</Badge>
      </div>
      <p className="mt-3 text-ink">“{review.body}”</p>
      <div className="mt-3 grid gap-1 text-sm text-muted">
        {review.repairSummary ? <p>Repair: {review.repairSummary}</p> : null}
        {review.priceCents ? <p>Price: {formatCents(review.priceCents)}</p> : null}
        <p>Would use again: {review.wouldUseAgain ? "Yes" : "No"}</p>
        <p>
          {review.customer.firstName} · {review.createdAt.toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}
