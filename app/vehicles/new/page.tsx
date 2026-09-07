import Link from "next/link";
import { AppNav, CUSTOMER_NAV } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createGenericAssetAction, createVehicleAction } from "@/app/actions/marketplace";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { ASSET_TYPES, INDUSTRIES } from "@/lib/catalog";

export const metadata = { title: "Add to garage" };

export default async function NewVehiclePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  await requireSession("CUSTOMER");
  const { kind } = await searchParams;
  const other = kind === "other";
  const makes = await prisma.vehicleMake.findMany({ include: { models: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } });
  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + 1 - i);
  const firstMake = makes[0];
  const otherIndustries = INDUSTRIES.filter((item) => item.key !== "AUTOMOTIVE");
  const firstOther = otherIndustries[0];
  const firstTypes = ASSET_TYPES.filter((item) => item.industry === firstOther.key);

  if (other) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <AppNav items={CUSTOMER_NAV} current="/vehicles" />
        <h1 className="text-3xl font-bold text-ink">Add equipment</h1>
        <p className="mt-2 text-sm text-muted">Boats, bikes, RVs, and machines use the same garage — with the right identifiers for each.</p>
        <form action={createGenericAssetAction} className="mt-6 space-y-4">
          <Field label="Industry">
            <Select name="industryKey" defaultValue={firstOther.key}>
              {otherIndustries.map((industry) => (
                <option key={industry.key} value={industry.key}>
                  {industry.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select name="assetTypeKey" defaultValue={firstTypes[0]?.key}>
              {ASSET_TYPES.filter((item) => item.industry !== "AUTOMOTIVE").map((type) => (
                <option key={`${type.industry}-${type.key}`} value={type.key}>
                  {type.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Year">
            <Select name="year" defaultValue={String(years[1])}>
              {years.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </Select>
          </Field>
          <Field label="Manufacturer">
            <Input name="manufacturer" required placeholder="Centurion" />
          </Field>
          <Field label="Model">
            <Input name="model" required placeholder="Ri230" />
          </Field>
          <Field label="Usage (miles or hours)">
            <Input name="usageValue" type="number" defaultValue={0} />
          </Field>
          <Field label="Serial / HIN / VIN">
            <Input name="serial" placeholder="Optional identifier" />
          </Field>
          <Field label="Nickname">
            <Input name="nickname" placeholder="The boat" />
          </Field>
          <Button type="submit">Save to garage</Button>
        </form>
        <p className="mt-4 text-sm">
          <Link href="/vehicles/new" className="text-accent">
            Back to add a vehicle
          </Link>
        </p>
      </div>
    );
  }

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
      <p className="mt-6 text-sm text-muted">
        Own a boat, bike, RV, or equipment?{" "}
        <Link href="/vehicles/new?kind=other" className="font-semibold text-accent">
          Add another kind of equipment
        </Link>
      </p>
    </div>
  );
}
