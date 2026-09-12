import { BoardRow } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Vehicles" };

export default async function AdminVehiclesPage() {
  await requireSession("ADMIN");
  const vehicles = await prisma.vehicle.findMany({
    include: { customer: true, make: true, model: true, _count: { select: { jobs: true } } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return (
    <div className="space-y-3">
      {vehicles.length === 0 ? (
        <p className="text-sm text-muted">No vehicles on file yet.</p>
      ) : (
        vehicles.map((vehicle) => (
          <BoardRow key={vehicle.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">
                  {vehicle.year} {vehicle.make.name} {vehicle.model.name}
                  {vehicle.nickname ? ` · ${vehicle.nickname}` : ""}
                </p>
                <p className="text-sm text-muted">
                  {vehicle.customer.firstName} {vehicle.customer.lastName} · {vehicle.customer.email}
                </p>
              </div>
              <p className="text-sm text-muted">
                {vehicle._count.jobs} job{vehicle._count.jobs === 1 ? "" : "s"}
                {vehicle.mileage ? ` · ${vehicle.mileage.toLocaleString()} mi/hr` : ""}
              </p>
            </div>
          </BoardRow>
        ))
      )}
    </div>
  );
}
