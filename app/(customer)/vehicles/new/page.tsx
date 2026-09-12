import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ThemedBoard } from "@/components/layout/themed-board";
import { VehicleMakeModelFields } from "@/components/vehicles/make-model-fields";
import { createVehicleAction } from "@/app/actions/marketplace";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Add a vehicle" };

export default async function NewVehiclePage() {
  await requireSession("CUSTOMER");
  const makes = await prisma.vehicleMake.findMany({ include: { models: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } });
  return (
    <ThemedBoard
      eyebrow="ADD A VEHICLE"
      title="Add a"
      accent="Machine."
      subtitle="Start with year, make, and model. It shows up in My Garage, requests, and the shop board."
      script="Good Machines Lead to Great Days."
      image="/landing/cat-automotive.png"
      wide={false}
    >
      <form action={createVehicleAction} className="space-y-4">
        <Field label="Year">
          <Input name="year" type="number" required min={1980} max={new Date().getFullYear() + 1} defaultValue={2024} />
        </Field>
        <VehicleMakeModelFields makes={makes} />
        <Field label="Trim">
          <Input name="trim" placeholder="Lariat" />
        </Field>
        <Field label="Engine">
          <Input name="engine" placeholder="6.7 Power Stroke" />
        </Field>
        <Field label="Drivetrain">
          <Input name="drivetrain" placeholder="4x4" />
        </Field>
        <Field label="Mileage or hours">
          <Input name="mileage" type="number" required min={0} placeholder="0" />
        </Field>
        <Field label="VIN or HIN (optional)">
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
