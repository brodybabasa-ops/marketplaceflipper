import Link from "next/link";
import { Star, X } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { ShopButton, ShopCard, ShopEmpty, ShopKpi, ShopPageHeader, ShopPill } from "@/components/shop-os/primitives";
import { replyToReviewAction } from "@/app/actions/mechanic";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatBoardDate, initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type ShopReviewRow = {
  id: string;
  overallRating: number;
  body: string;
  repairSummary: string | null;
  createdAt: Date;
  customer: { firstName: string; lastName: string; email: string; phone: string | null };
  job: {
    id: string;
    serviceRequest: { problemText: string };
    vehicle: { year: number; make: { name: string }; model: { name: string } };
  };
  response: { body: string; createdAt: Date } | null;
};

export function ShopReviewsBoard({
  reviews,
  selectedId,
  stats,
}: {
  reviews: ShopReviewRow[];
  selectedId?: string;
  stats: {
    average: number;
    count: number;
    fiveStar: number;
    new30: number;
    buckets: number[];
  };
}) {
  const selected = reviews.find((item) => item.id === selectedId) ?? reviews[0];
  const fivePct = stats.count ? Math.round((stats.fiveStar / stats.count) * 100) : 0;
  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader
        title="Reviews"
        subtitle="See what your customers are saying. Build trust and grow your business."
        actions={<ShopButton href="/mechanic/jobs">Request Review</ShopButton>}
      />
      <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ShopKpi icon={<Star className="h-5 w-5" />} label="Average Rating" value={stats.average.toFixed(1)} hint={<span className="text-[#6b7c8d]">Based on {stats.count} reviews</span>} tone="amber" />
          <ShopKpi icon={<Star className="h-5 w-5" />} label="Total Reviews" value={stats.count} tone="sky" />
          <ShopKpi icon={<Star className="h-5 w-5" />} label="5-Star Reviews" value={stats.fiveStar} hint={<span className="text-[#6b7c8d]">{fivePct}% of total</span>} tone="green" />
          <ShopKpi icon={<Star className="h-5 w-5" />} label="New Reviews" value={stats.new30} hint={<span className="text-[#6b7c8d]">Last 30 days</span>} />
        </div>
        <ShopCard className="p-4">
          <p className="text-[13px] font-bold">Rating Breakdown</p>
          <div className="mt-2 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.buckets[star - 1] ?? 0;
              const pct = stats.count ? Math.round((count / stats.count) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-[12px]">
                  <span className="w-3 font-bold">{star}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef3f8]">
                    <div className="h-full rounded-full bg-[#f5c542]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-[#6b7c8d]">
                    {pct}% ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </ShopCard>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ShopCard className="overflow-hidden">
          {reviews.length === 0 ? (
            <ShopEmpty title="No reviews yet" body="Completed jobs can be reviewed by the customer who booked them." />
          ) : (
            <ul>
              {reviews.map((review) => (
                <li key={review.id} className={cn("border-b border-[#eef3f8]", selected?.id === review.id && "bg-[#eef4ff]")}>
                  <Link href={`/mechanic/reviews?id=${review.id}`} className="flex items-start gap-3 px-4 py-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2f7bff] text-xs font-bold text-white">
                      {initials(review.customer.firstName, review.customer.lastName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">
                          {review.customer.firstName} {review.customer.lastName.charAt(0)}.
                        </p>
                        <span className="text-[12px] text-[#8a97a6]">{formatBoardDate(review.createdAt)}</span>
                      </div>
                      <Rating value={review.overallRating} size="sm" />
                      <p className="mt-1 text-[12px] text-[#6b7c8d]">
                        {review.job.vehicle.year} {review.job.vehicle.make.name} {review.job.vehicle.model.name} · {review.job.serviceRequest.problemText}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm">{review.body}</p>
                    </div>
                    {review.response ? <ShopPill label="Replied" className="bg-[#e7f8ee] text-[#15803d]" /> : <ShopPill label="Respond" className="bg-[#e8f1ff] text-[#2f7bff]" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ShopCard>
        {selected ? (
          <ShopCard className="overflow-hidden p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold">
                  {selected.customer.firstName} {selected.customer.lastName.charAt(0)}.
                </p>
                <Rating value={selected.overallRating} size="sm" />
                <p className="mt-1 text-[12px] text-[#6b7c8d]">{formatBoardDate(selected.createdAt)}</p>
              </div>
              <Link href="/mechanic/reviews" className="text-[#8a97a6]">
                <X className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-3 text-sm">{selected.body}</p>
            <div className="mt-4 rounded-xl bg-[#f8fafc] p-3">
              <p className="text-[12px] font-bold">Your Response</p>
              <form action={replyToReviewAction} className="mt-2 space-y-2">
                <input type="hidden" name="reviewId" value={selected.id} />
                <Textarea name="body" required minLength={8} defaultValue={selected.response?.body ?? ""} placeholder="Thanks for the kind words..." />
                <Button type="submit" size="sm">
                  {selected.response ? "Update reply" : "Post reply"}
                </Button>
              </form>
            </div>
            <div className="mt-4 text-sm">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#8a97a6]">Customer Info</p>
              <p className="mt-1">{selected.customer.phone ?? "No phone"}</p>
              <p className="text-[#6b7c8d]">{selected.customer.email}</p>
              <Link href={`/mechanic/jobs/${selected.job.id}`} className="mt-2 inline-block text-[13px] font-semibold text-[#2f7bff]">
                Open related job
              </Link>
            </div>
          </ShopCard>
        ) : null}
      </div>
    </div>
  );
}
