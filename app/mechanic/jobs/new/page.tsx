import { ShopRepairOrderForm } from "@/components/jobs/shop-repair-order-form";
import { ShopCard, ShopPageHeader } from "@/components/shop-os/primitives";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "New repair order" };

export default async function NewRepairOrderPage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({ where: { userId: session.id } });
  const related = await prisma.job.findMany({
    where: { mechanicProfileId: profile.id },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  const ids = related.map((job) => job.customerId);
  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      vehicles: { some: { archivedAt: null } },
      OR: [...(ids.length ? [{ id: { in: ids } }] : []), { customerProfile: { zip: profile.shopZip ?? "84041" } }],
    },
    include: { vehicles: { where: { archivedAt: null }, include: { make: true, model: true }, orderBy: { createdAt: "asc" } } },
    take: 40,
  });
  const customers = users
    .filter((user) => user.vehicles.length > 0)
    .map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      vehicles: user.vehicles.map((vehicle) => ({
        id: vehicle.id,
        label: `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`,
      })),
    }));

  return (
    <div className="px-5 py-5 lg:px-6">
      <ShopPageHeader
        title="New repair order"
        subtitle="Opens a live job, thread, and optional appointment on the same record the customer sees."
      />
      <ShopCard className="max-w-xl p-5">
        <ShopRepairOrderForm customers={customers} />
      </ShopCard>
    </div>
  );
}
