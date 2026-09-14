import { ShopVehiclesView } from "@/components/shop-os/list-pages";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { vehiclePhotoFor } from "@/lib/landing";

export const metadata = { title: "Vehicles" };

export default async function MechanicVehiclesPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const jobs = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id },
    include: { customer: true, vehicle: { include: { make: true, model: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const byVehicle = new Map<string, (typeof jobs)[number]>();
  for (const job of jobs) {
    if (!byVehicle.has(job.vehicleId)) byVehicle.set(job.vehicleId, job);
  }
  return (
    <ShopVehiclesView
      vehicles={[...byVehicle.values()].map((job) => ({
        id: job.vehicleId,
        label: `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`,
        customer: `${job.customer.firstName} ${job.customer.lastName}`,
        vin: job.vehicle.vin,
        href: `/mechanic/jobs?job=${job.id}`,
        photo: job.vehicle.photoUrl || vehiclePhotoFor(job.vehicle.make.name, job.vehicle.model.name),
      }))}
    />
  );
}
