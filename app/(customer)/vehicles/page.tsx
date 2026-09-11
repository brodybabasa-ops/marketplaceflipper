import Link from "next/link";
import { VehicleCard } from "@/components/jobs/vehicle-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "My vehicles" };

export default async function VehiclesPage() {
  const session = await requireSession("CUSTOMER");
  const vehicles = await prisma.vehicle.findMany({
    where: { customerId: session.id },
    include: { make: true, model: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">My vehicles</h1>
        <Button asChild>
          <Link href="/vehicles/new">Add vehicle</Link>
        </Button>
      </div>
      {vehicles.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No vehicles yet" body="Add the vehicle that needs help. Nickname optional." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={{
                id: vehicle.id,
                year: vehicle.year,
                make: vehicle.make.name,
                model: vehicle.model.name,
                mileage: vehicle.mileage,
                nickname: vehicle.nickname,
              }}
              ctaHref={`/request?vehicle=${vehicle.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
