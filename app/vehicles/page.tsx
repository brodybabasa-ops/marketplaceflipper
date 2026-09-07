import Link from "next/link";
import { CustomerAppNav } from "@/components/layout/app-nav";
import { GarageCard } from "@/components/jobs/garage-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { garageCardCopy, listGarage } from "@/services/assets";

export const metadata = { title: "My Garage" };

export default async function VehiclesPage() {
  const session = await requireSession("CUSTOMER");
  const { assets, headline } = await listGarage(session.id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <CustomerAppNav current="/vehicles" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">{headline.title}</h1>
          <p className="mt-1 text-sm text-muted">{headline.body}</p>
        </div>
        <Button asChild>
          <Link href="/vehicles/new">{headline.addLabel}</Link>
        </Button>
      </div>
      {assets.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing in your garage yet" body="Add the vehicle that needs help. Nickname optional." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {assets.map((asset) => {
            const card = garageCardCopy(asset);
            return (
              <GarageCard
                key={asset.id}
                card={card}
                href={`/vehicles/${asset.vehicleId ?? asset.id}`}
                ctaHref={`/fix?asset=${asset.id}`}
          ctaLabel="Fix It"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
