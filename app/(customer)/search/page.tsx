import { EmptyState } from "@/components/ui/card";
import { ThemedBoard, BoardLink } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { searchCustomerWorkspace } from "@/services/customer-search";

export const metadata = { title: "Search" };

export default async function CustomerSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession("CUSTOMER");
  const q = (await searchParams).q?.trim() ?? "";
  const results = await searchCustomerWorkspace(session.id, q);
  const total = results.shops.length + results.vehicles.length + results.jobs.length + results.threads.length;

  return (
    <ThemedBoard
      eyebrow="SEARCH"
      title="Find it in"
      accent="One place."
      subtitle="Shops, vehicles, repairs, and threads — not just the directory."
      script="Keep It Running."
      image="/landing/lifestyle.png"
    >
      <form action="/search" className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search shops, vehicles, repairs, or messages..."
          className="h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
      </form>
      {!q ? (
        <EmptyState title="Search your shop loop" body="Try a shop name, a vehicle, or the problem you already requested." />
      ) : total === 0 ? (
        <EmptyState title="Nothing matched" body={`No shops, vehicles, repairs, or messages for “${q}”.`} />
      ) : (
        <div className="space-y-8">
          {results.shops.length ? (
            <section>
              <h2 className="text-lg font-semibold text-navy">Shops</h2>
              <div className="mt-3 space-y-3">
                {results.shops.map((shop) => (
                  <BoardLink key={shop.id} href={`/mechanics/${shop.slug}`}>
                    <p className="font-semibold text-navy">{shop.businessName}</p>
                    <p className="text-sm text-muted">
                      {shop.shopCity}, {shop.shopState}
                    </p>
                  </BoardLink>
                ))}
              </div>
            </section>
          ) : null}
          {results.vehicles.length ? (
            <section>
              <h2 className="text-lg font-semibold text-navy">Vehicles</h2>
              <div className="mt-3 space-y-3">
                {results.vehicles.map((vehicle) => (
                  <BoardLink key={vehicle.id} href={`/vehicles/${vehicle.id}/edit`}>
                    <p className="font-semibold text-navy">
                      {vehicle.year} {vehicle.make.name} {vehicle.model.name}
                    </p>
                    <p className="text-sm text-muted">{vehicle.nickname ?? "Garage vehicle"}</p>
                  </BoardLink>
                ))}
              </div>
            </section>
          ) : null}
          {results.jobs.length ? (
            <section>
              <h2 className="text-lg font-semibold text-navy">Repairs</h2>
              <div className="mt-3 space-y-3">
                {results.jobs.map((job) => (
                  <BoardLink key={job.id} href={`/jobs/${job.id}`}>
                    <p className="font-semibold text-navy">{job.serviceRequest.problemText}</p>
                    <p className="text-sm text-muted">
                      {job.mechanicProfile.businessName} · {job.vehicle.year} {job.vehicle.make.name}{" "}
                      {job.vehicle.model.name}
                    </p>
                  </BoardLink>
                ))}
              </div>
            </section>
          ) : null}
          {results.threads.length ? (
            <section>
              <h2 className="text-lg font-semibold text-navy">Messages</h2>
              <div className="mt-3 space-y-3">
                {results.threads.map((thread) => (
                  <BoardLink key={thread.id} href={`/messages/${thread.id}`}>
                    <p className="font-semibold text-navy">
                      {thread.mechanic.mechanicProfile?.businessName ??
                        `${thread.mechanic.firstName} ${thread.mechanic.lastName}`}
                    </p>
                    <p className="truncate text-sm text-muted">{thread.messages[0]?.body ?? "Open conversation"}</p>
                  </BoardLink>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </ThemedBoard>
  );
}
