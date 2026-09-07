import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createRequestAction } from "@/app/actions/marketplace";
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
  const vehicles = await prisma.vehicle.findMany({
    where: { customerId: session.id },
    include: { make: true, model: true },
  });
  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.id } });
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <AppNav items={CUSTOMER_NAV} current="/request" />
      <h1 className="text-3xl font-bold text-navy">What does your vehicle need?</h1>
      <p className="mt-2 text-sm text-muted">Use everyday language. “Truck shakes when braking” is enough.</p>
      <form action={createRequestAction} className="mt-6 space-y-4">
        {params.mechanic ? <input type="hidden" name="mechanicProfileId" value={params.mechanic} /> : null}
        <Field label="Vehicle">
          <Select name="vehicleId" defaultValue={params.vehicle ?? vehicles[0]?.id} required>
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
          <Input name="zip" required defaultValue={profile?.zip ?? "84101"} />
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
        <Button type="submit">{params.mechanic ? "Request this mechanic" : "Find Mechanics"}</Button>
      </form>
    </div>
  );
}
