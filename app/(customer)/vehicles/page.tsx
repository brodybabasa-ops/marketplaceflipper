import Link from "next/link";
import { VehicleCard } from "@/components/jobs/vehicle-card";
import { EmptyState } from "@/components/ui/card";
import { ThemedBoard } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "My vehicles" };

export default async function VehiclesPage() {
  const session = await requireSession("CUSTOMER");
  const vehicles = await prisma.vehicle.findMany({
    where: { customerId: session.id },
    include: { make: true, model: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <ThemedBoard
      eyebrow="MY VEHICLES"
      title="Your"
      accent="Machines."
      subtitle="Everything you keep running lives here."
      script="Good Machines Lead to Great Days."
      image="/landing/hero-truck.png"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{vehicles.length} vehicles on your account</p>
        <Link href="/vehicles/new" className="inline-flex h-10 items-center rounded-xl bg-[#2f7bff] px-4 text-sm font-semibold text-white">
          Add vehicle
        </Link>
      </div>
      {vehicles.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No vehicles yet" body="Add the vehicle that needs help. Nickname optional." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
    </ThemedBoard>
  );
}
