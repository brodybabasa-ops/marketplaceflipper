import { ShopRequestsView } from "@/components/shop-os/list-pages";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Requests" };

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { q } = await searchParams;
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const offers = await prisma.serviceRequestOffer.findMany({
    where: { mechanicProfileId: profile.id, status: "PENDING" },
    include: {
      request: { include: { customer: true, vehicle: { include: { make: true, model: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id, status: "REQUESTED" },
    include: { customer: true, vehicle: { include: { make: true, model: true } }, serviceRequest: true },
    orderBy: { createdAt: "desc" },
  });
  const term = q?.trim().toLowerCase();
  const filteredOffers = term
    ? offers.filter((offer) =>
        `${offer.request.customer.firstName} ${offer.request.customer.lastName} ${offer.request.problemText}`.toLowerCase().includes(term),
      )
    : offers;
  return (
    <ShopRequestsView
      offers={filteredOffers.map((offer) => ({
        id: offer.id,
        problemText: offer.request.problemText,
        customer: `${offer.request.customer.firstName} ${offer.request.customer.lastName}`,
        vehicle: `${offer.request.vehicle.year} ${offer.request.vehicle.make.name} ${offer.request.vehicle.model.name}`,
      }))}
      jobs={jobs.map((job) => ({
        id: job.id,
        status: job.status,
        customer: `${job.customer.firstName} ${job.customer.lastName}`,
        vehicle: `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`,
        problemText: job.serviceRequest.problemText,
      }))}
    />
  );
}
