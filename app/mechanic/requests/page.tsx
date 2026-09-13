import MechanicJobsList from "../_jobs-list";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { OfferResponseButtons } from "@/components/jobs/offer-response-buttons";

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
  const filtered = q?.trim()
    ? offers.filter((offer) => {
        const haystack = `${offer.request.customer.firstName} ${offer.request.customer.lastName} ${offer.request.vehicle.make.name} ${offer.request.vehicle.model.name} ${offer.request.problemText}`.toLowerCase();
        return haystack.includes(q.trim().toLowerCase());
      })
    : offers;
  return (
    <div className="space-y-8">
      {filtered.length ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Incoming matches</h2>
          <div className="space-y-3">
            {filtered.map((offer) => (
              <article key={offer.id} className="rounded-xl border border-line bg-paper px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">
                      {offer.request.customer.firstName} {offer.request.customer.lastName}
                    </p>
                    <p className="text-sm text-muted">
                      {offer.request.vehicle.year} {offer.request.vehicle.make.name} {offer.request.vehicle.model.name}
                    </p>
                    <p className="mt-1 text-sm">{offer.request.problemText}</p>
                  </div>
                  <OfferResponseButtons offerId={offer.id} />
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Open repair orders</h2>
        <MechanicJobsList title="Pending requests" href="/mechanic/requests" statuses={["REQUESTED"]} q={q} />
      </div>
    </div>
  );
}
