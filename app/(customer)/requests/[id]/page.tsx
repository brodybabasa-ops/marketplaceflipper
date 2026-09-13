import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ThemedBoard } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { getMatchedRequestForCustomer } from "@/services/jobs";
import { vehiclePhotoFor } from "@/lib/landing";

export const metadata = { title: "Request" };

export default async function CustomerRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession("CUSTOMER");
  const { id } = await params;
  const request = await getMatchedRequestForCustomer(id, session.id);
  if (!request) notFound();
  const vehicleLabel = `${request.vehicle.year} ${request.vehicle.make.name} ${request.vehicle.model.name}`;
  const acceptedJob = request.jobs.find((job) => job.status !== "CANCELLED");
  return (
    <ThemedBoard
      eyebrow="SERVICE REQUEST"
      title={request.problemText}
      subtitle={vehicleLabel}
      script="We'll get you there."
      image={vehiclePhotoFor(request.vehicle.make.name, request.vehicle.model.name)}
    >
      <Card className="border-0 bg-[#f7f9fc] p-5 shadow-none">
        <h2 className="font-semibold text-navy">Matched shops</h2>
        <p className="mt-1 text-sm text-muted">
          {request.status === "MATCHED"
            ? "These shops received your request. The first one to accept opens the repair order."
            : request.status === "ACCEPTED"
              ? "A shop accepted. Track the job from here."
              : request.status === "EXPIRED"
                ? "No shop took this request. Send it again from Request Service."
                : `Status: ${request.status.toLowerCase()}`}
        </p>
        <ul className="mt-4 space-y-3">
          {request.offers.map((offer) => (
            <li key={offer.id} className="rounded-xl bg-white px-4 py-3">
              <p className="font-semibold text-navy">{offer.mechanic.businessName}</p>
              <p className="text-sm text-muted">
                {[offer.mechanic.shopCity, offer.mechanic.shopState].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#2f7bff]">
                {offer.status === "PENDING"
                  ? "Waiting for a response"
                  : offer.status === "ACCEPTED"
                    ? "Accepted"
                    : offer.status === "DECLINED"
                      ? "Declined"
                      : offer.status === "WITHDRAWN"
                        ? "Closed when another shop accepted"
                        : offer.status}
              </p>
            </li>
          ))}
        </ul>
        {acceptedJob ? (
          <Link href={`/jobs/${acceptedJob.id}`} className="mt-4 inline-block text-sm font-semibold text-[#2f7bff]">
            Open repair order {acceptedJob.repairOrderNumber ?? ""}
          </Link>
        ) : (
          <Link href="/request" className="mt-4 inline-block text-sm font-semibold text-[#2f7bff]">
            Send another request
          </Link>
        )}
      </Card>
    </ThemedBoard>
  );
}
