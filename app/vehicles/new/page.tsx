import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createVehicleAction } from "@/app/actions/marketplace";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Add a vehicle" };

export default async function NewVehiclePage() {
  await requireSession("CUSTOMER");
  const makes = await prisma.vehicleMake.findMany({ include: { models: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } });
  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + 1 - i);
  const firstMake = makes[0];
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <AppNav items={CUSTOMER_NAV} current="/vehicles" />
      <h1 className="text-3xl font-bold text-ink">Add a vehicle</h1>
      <p className="mt-2 text-sm text-muted">Start with year, make, and model. Everything else is optional.</p>
      <form action={createVehicleAction} className="mt-6 space-y-4">
        <Field label="Year">
          <Select name="year" defaultValue={String(years[1])}>
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </Select>
        </Field>
        <Field label="Make">
          <Select name="makeId" defaultValue={firstMake?.id}>
            {makes.map((make) => (
              <option key={make.id} value={make.id}>
                {make.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Model">
          <Select name="modelId" defaultValue={firstMake?.models[0]?.id}>
            {makes.flatMap((make) =>
              make.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {make.name} {model.name}
                </option>
              )),
            )}
          </Select>
        </Field>
        <Field label="Trim">
          <Input name="trim" placeholder="Lariat" />
        </Field>
        <Field label="Engine">
          <Input name="engine" placeholder="6.7 Power Stroke" />
        </Field>
        <Field label="Drivetrain">
          <Input name="drivetrain" placeholder="4x4" />
        </Field>
        <Field label="Mileage">
          <Input name="mileage" type="number" required defaultValue={87000} />
        </Field>
        <Field label="VIN (optional)">
          <Input name="vin" maxLength={17} />
        </Field>
        <Field label="License plate">
          <Input name="plate" placeholder="ABC-1234" />
        </Field>
        <Field label="Color">
          <Input name="color" placeholder="Oxford White" />
        </Field>
        <Field label="Nickname">
          <Input name="nickname" placeholder="The truck" />
        </Field>
        <Field label="Notes">
          <Textarea name="notes" placeholder="Anything a mechanic should know" />
        </Field>
        <Button type="submit">Save vehicle</Button>
      </form>
    </div>
  );
}
