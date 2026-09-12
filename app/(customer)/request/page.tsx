import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ThemedBoard } from "@/components/layout/themed-board";
import { createRequestAction } from "@/app/actions/marketplace";
import { FREDS_MARINE_SLUG } from "@/lib/constants";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Request service" };

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string; mechanic?: string }>;
}) {
  const session = await requireSession("CUSTOMER");
  const params = await searchParams;
  const [vehicles, profile, namedShop, fred] = await Promise.all([
    prisma.vehicle.findMany({
      where: { customerId: session.id },
      include: { make: true, model: true },
    }),
    prisma.customerProfile.findUnique({ where: { userId: session.id } }),
    params.mechanic
      ? prisma.mechanicProfile.findUnique({
          where: { id: params.mechanic },
          select: { id: true, businessName: true, shopCity: true, shopState: true, slug: true },
        })
      : Promise.resolve(null),
    prisma.mechanicProfile.findUnique({
      where: { slug: FREDS_MARINE_SLUG },
      select: { id: true, businessName: true, shopCity: true, shopState: true, slug: true },
    }),
  ]);
  const shop = namedShop ?? fred;
  const prefersBoat = shop?.slug === FREDS_MARINE_SLUG;
  const boat = vehicles.find((vehicle) => vehicle.make.name === "Centurion");
  const defaultVehicleId = params.vehicle ?? (prefersBoat ? boat?.id : undefined) ?? vehicles[0]?.id;
  const shopPlace = [shop?.shopCity, shop?.shopState].filter(Boolean).join(", ");

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
      <form action={createRequestAction} className="space-y-4">
        {shop ? <input type="hidden" name="mechanicProfileId" value={shop.id} /> : null}
        {shop ? (
          <div className="rounded-2xl bg-[#f7f9fc] px-4 py-3">
            <p className="text-xs font-bold tracking-[0.16em] text-[#2f7bff]">SENDING TO</p>
            <p className="mt-1 font-semibold text-navy">{shop.businessName}</p>
            {shopPlace ? <p className="text-sm text-muted">{shopPlace}</p> : null}
          </div>
        ) : null}
        <Field label="Vehicle">
          <Select name="vehicleId" defaultValue={defaultVehicleId} required>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make.name} {vehicle.model.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="What does your vehicle need?">
          <Input name="problemText" required placeholder="Truck shakes when braking." />
        </Field>
        <Field label="More detail (optional)">
          <Textarea name="description" placeholder="When it happens, warning lights, recent work..." />
        </Field>
        <Field label="ZIP code">
          <Input name="zip" required defaultValue={profile?.zip ?? "84041"} />
        </Field>
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
        <Button type="submit">{shop ? `Send request to ${shop.businessName}` : "Request service"}</Button>
      </form>
    </ThemedBoard>
  );
}
