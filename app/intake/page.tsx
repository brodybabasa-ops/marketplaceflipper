import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createRequestAction } from "@/app/actions/marketplace";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "What’s going on?" };

export default async function IntakePage({
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
    <div>
      <AppNav items={CUSTOMER_NAV} current="/intake" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Issue intake</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">What’s going on with your vehicle?</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Everyday language is enough. Pocket Mechanic uses this to match the right provider — it is not a diagnosis.
      </p>
      <form action={createRequestAction} className="mt-6 max-w-xl space-y-4">
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
        <Field label="Describe the symptoms">
          <Textarea name="problemText" required placeholder="My F-150 clicks when I turn left." />
        </Field>
        <Field label="When does it happen?">
          <Select name="whenItHappens" defaultValue="not-sure">
            <option value="moving">Moving</option>
            <option value="stopped">Stopped</option>
            <option value="both">Both</option>
            <option value="not-sure">Not sure</option>
          </Select>
        </Field>
        <Field label="When did it start?">
          <Input name="startedWhen" placeholder="This morning / last week / gradually" />
        </Field>
        <Field label="Warning lights">
          <Input name="warningLights" placeholder="Check engine, ABS, none" />
        </Field>
        <Field label="Can you drive it?">
          <Select name="drivability" defaultValue="yes">
            <option value="yes">Yes</option>
            <option value="limited">Yes, but carefully</option>
            <option value="no">No, it shouldn't be driven</option>
          </Select>
        </Field>
        <Field label="When do you notice it?">
          <Input name="description" placeholder="Turning, braking, accelerating, over bumps, idling..." />
        </Field>
        <Field label="ZIP code">
          <Input name="zip" required defaultValue={profile?.zip ?? "84101"} />
        </Field>
        <Field label="Preferred date">
          <Input name="preferredDate" type="date" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="mobilePreferred" defaultChecked className="h-4 w-4" />
          Prefer a mechanic who can come to me
        </label>
        <Button type="submit">Find my mechanic</Button>
      </form>
    </div>
  );
}
