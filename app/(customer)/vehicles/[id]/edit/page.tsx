import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ThemedBoard } from "@/components/layout/themed-board";
import { VehicleMakeModelFields } from "@/components/vehicles/make-model-fields";
import { archiveVehicleAction, updateVehicleAction } from "@/app/actions/marketplace";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Edit vehicle" };

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession("CUSTOMER");
  const { id } = await params;
  const [vehicle, makes] = await Promise.all([
    prisma.vehicle.findFirst({
      where: { id, customerId: session.id },
      include: { make: true, model: true, _count: { select: { jobs: true } } },
    }),
    prisma.vehicleMake.findMany({ include: { models: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } }),
  ]);
  if (!vehicle) notFound();
  const hasJobs = vehicle._count.jobs > 0;

  return (
    <ThemedBoard
      eyebrow="MY GARAGE"
      title="Edit"
      accent="Machine."
      subtitle={`${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`}
      script="Keep It Running."
      image="/landing/cat-automotive.png"
      wide={false}
    >
      <form action={updateVehicleAction} className="space-y-4">
        <input type="hidden" name="vehicleId" value={vehicle.id} />
        <Field label="Year">
          <Input name="year" type="number" required min={1980} max={new Date().getFullYear() + 1} defaultValue={vehicle.year} />
        </Field>
        <VehicleMakeModelFields makes={makes} defaultModelId={vehicle.modelId} />
        <Field label="Trim">
          <Input name="trim" defaultValue={vehicle.trim ?? ""} />
        </Field>
        <Field label="Engine">
          <Input name="engine" defaultValue={vehicle.engine ?? ""} />
        </Field>
        <Field label="Drivetrain">
          <Input name="drivetrain" defaultValue={vehicle.drivetrain ?? ""} />
        </Field>
        <Field label="Mileage or hours">
          <Input name="mileage" type="number" required min={0} defaultValue={vehicle.mileage} />
        </Field>
        <Field label="VIN or HIN">
          <Input name="vin" maxLength={17} defaultValue={vehicle.vin ?? ""} />
        </Field>
        <Field label="Nickname">
          <Input name="nickname" defaultValue={vehicle.nickname ?? ""} />
        </Field>
        <Field label="Notes">
          <Textarea name="notes" defaultValue={vehicle.notes ?? ""} />
        </Field>
        <Button type="submit">Save vehicle</Button>
      </form>
      <form action={archiveVehicleAction} className="mt-6">
        <input type="hidden" name="vehicleId" value={vehicle.id} />
        <Button type="submit" variant={vehicle.archivedAt ? "secondary" : "danger"}>
          {vehicle.archivedAt ? "Restore to garage" : hasJobs ? "Archive vehicle" : "Delete vehicle"}
        </Button>
        <p className="mt-2 text-sm text-muted">
          {hasJobs
            ? "This machine has jobs on file, so it is archived instead of deleted."
            : "No jobs yet — this permanently removes it from your garage."}
        </p>
      </form>
      <p className="mt-4">
        <Link href="/vehicles" className="text-sm font-semibold text-[#2f7bff]">
          Back to garage
        </Link>
      </p>
    </ThemedBoard>
  );
}
