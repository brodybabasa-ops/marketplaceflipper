import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ThemedBoard } from "@/components/layout/themed-board";
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
    <ThemedBoard
      eyebrow="ADD A VEHICLE"
      title="Add a"
      accent="Machine."
      subtitle="Start with year, make, and model. Everything else is optional."
      script="Good Machines Lead to Great Days."
      image="/landing/cat-automotive.png"
      wide={false}
    >
      <form action={createVehicleAction} className="space-y-4">
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
        <Field label="Nickname">
          <Input name="nickname" placeholder="The truck" />
        </Field>
        <Field label="Notes">
          <Textarea name="notes" placeholder="Anything a mechanic should know" />
        </Field>
        <Button type="submit">Save vehicle</Button>
      </form>
    </ThemedBoard>
  );
}
