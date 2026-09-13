import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ThemedBoard } from "@/components/layout/themed-board";
import { RequestFormFields } from "@/components/jobs/request-form-fields";
import { createRequestAction } from "@/app/actions/marketplace";
import { FREDS_MARINE_SLUG, PRECISION_AUTO_SLUG } from "@/lib/constants";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { isMarineVehicle } from "@/lib/vehicles";

export const metadata = { title: "Request service" };

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string; mechanic?: string }>;
}) {
  const session = await requireSession("CUSTOMER");
  const params = await searchParams;
  const [vehicles, profile, namedShop, shops] = await Promise.all([
    prisma.vehicle.findMany({
      where: { customerId: session.id, archivedAt: null },
      include: { make: true, model: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerProfile.findUnique({ where: { userId: session.id } }),
    params.mechanic
      ? prisma.mechanicProfile.findUnique({
          where: { id: params.mechanic },
          select: { id: true, businessName: true, shopCity: true, shopState: true, slug: true, acceptsNewJobs: true },
        })
      : Promise.resolve(null),
    prisma.mechanicProfile.findMany({
      where: { acceptsNewJobs: true },
      select: { id: true, businessName: true, shopCity: true, shopState: true, slug: true },
      orderBy: { businessName: "asc" },
    }),
  ]);
  const lockShop = Boolean(namedShop?.acceptsNewJobs);
  const vehicleOptions = vehicles.map((vehicle) => ({
    id: vehicle.id,
    label: `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`,
    marine: isMarineVehicle(vehicle.make.name, vehicle.model.name),
  }));
  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === params.vehicle) ??
    (namedShop?.slug === FREDS_MARINE_SLUG
      ? vehicles.find((vehicle) => isMarineVehicle(vehicle.make.name, vehicle.model.name))
      : undefined) ??
    vehicles[0];
  const defaultSlug = selectedVehicle && isMarineVehicle(selectedVehicle.make.name, selectedVehicle.model.name)
    ? FREDS_MARINE_SLUG
    : PRECISION_AUTO_SLUG;
  const defaultShopId =
    (namedShop?.acceptsNewJobs ? namedShop.id : undefined) ??
    shops.find((shop) => shop.slug === defaultSlug)?.id ??
    shops[0]?.id;
  const submitShop = shops.find((shop) => shop.id === defaultShopId);

  return (
    <ThemedBoard
      eyebrow="REQUEST SERVICE"
      title="What needs"
      accent="Fixed?"
      subtitle="Use everyday language. “Truck shakes when braking” is enough."
      script="We'll get you there."
      image="/landing/hero-truck.png"
      wide={false}
    >
      {vehicles.length === 0 ? (
        <p className="text-sm text-muted">Add a vehicle to your garage before sending a request.</p>
      ) : (
        <form action={createRequestAction} className="space-y-4">
          <RequestFormFields
            vehicles={vehicleOptions}
            shops={shops}
            defaultVehicleId={selectedVehicle?.id}
            defaultShopId={defaultShopId}
            lockShop={lockShop}
            zip={profile?.zip ?? "84041"}
          />
          <Field label="Preferred date">
            <Input name="preferredDate" type="date" />
          </Field>
          <Field label="Preferred time">
            <Select name="preferredTimeWindow" defaultValue="morning">
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="saturday">Saturday</option>
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="mobilePreferred" defaultChecked className="h-4 w-4" />
            Prefer a mechanic who can come to me
          </label>
          <Button type="submit">
            {lockShop && namedShop ? `Send request to ${namedShop.businessName}` : submitShop ? `Send request to ${submitShop.businessName}` : "Request service"}
          </Button>
        </form>
      )}
    </ThemedBoard>
  );
}
