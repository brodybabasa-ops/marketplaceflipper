import { BoardRow } from "@/components/layout/themed-board";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Vehicles" };

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireSession("ADMIN");
  const { q } = await searchParams;
  const term = q?.trim();
  const where: Prisma.VehicleWhereInput = term
    ? {
        OR: [
          { nickname: { contains: term, mode: "insensitive" } },
          { vin: { contains: term, mode: "insensitive" } },
          { make: { name: { contains: term, mode: "insensitive" } } },
          { model: { name: { contains: term, mode: "insensitive" } } },
          { customer: { firstName: { contains: term, mode: "insensitive" } } },
          { customer: { lastName: { contains: term, mode: "insensitive" } } },
          { customer: { email: { contains: term, mode: "insensitive" } } },
        ],
      }
    : {};
  const vehicles = await prisma.vehicle.findMany({
    where,
    include: { customer: true, make: true, model: true, _count: { select: { jobs: true } } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return (
    <div className="space-y-3">
      {term ? <p className="text-sm text-muted">Showing matches for “{term}”.</p> : null}
      {vehicles.length === 0 ? (
        <p className="text-sm text-muted">{term ? "No vehicles matched that search." : "No vehicles on file yet."}</p>
      ) : (
        vehicles.map((vehicle) => (
          <BoardRow key={vehicle.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">
                  {vehicle.year} {vehicle.make.name} {vehicle.model.name}
                  {vehicle.nickname ? ` · ${vehicle.nickname}` : ""}
                  {vehicle.archivedAt ? " · archived" : ""}
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
