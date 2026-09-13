"use client";

import { useState } from "react";
import { decodeVinAction, createVehicleAction } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { VehicleMakeModelFields } from "@/components/vehicles/make-model-fields";

export function VinImportForm({
  makes,
  initial,
}: {
  makes: { id: string; name: string; models: { id: string; name: string }[] }[];
  initial?: {
    vin?: string;
    year?: string;
    modelId?: string;
    make?: string;
    model?: string;
    error?: string;
  };
}) {
  const [vin, setVin] = useState(initial?.vin ?? "");
  const decoded = Boolean(initial?.modelId || initial?.year || initial?.error);

  return (
    <div className="space-y-6">
      <form action={decodeVinAction} className="space-y-4">
        <Field label="VIN or HIN">
          <Input
            name="vin"
            value={vin}
            onChange={(event) => setVin(event.target.value.toUpperCase())}
            maxLength={17}
            placeholder="17-character VIN"
            required
          />
        </Field>
        <Button type="submit" variant="secondary">
          Decode VIN
        </Button>
      </form>

      {initial?.error ? <p className="text-sm text-danger">{initial.error}</p> : null}
      {initial?.make && initial?.model ? (
        <p className="text-sm text-navy">
          Decoded {initial.year} {initial.make} {initial.model}
        </p>
      ) : null}

      <form action={createVehicleAction} className="space-y-4">
        <input type="hidden" name="vin" value={vin} />
        <Field label="Year">
          <Input
            name="year"
            type="number"
            required
            min={1980}
            max={new Date().getFullYear() + 1}
            defaultValue={initial?.year ?? 2024}
          />
        </Field>
        <VehicleMakeModelFields makes={makes} defaultModelId={initial?.modelId} />
        <Field label="Mileage or hours">
          <Input name="mileage" type="number" required min={0} defaultValue={0} />
        </Field>
        <Field label="Nickname">
          <Input name="nickname" placeholder="Daily" />
        </Field>
        <Field label="Notes">
          <Textarea name="notes" placeholder="Anything a mechanic should know" />
        </Field>
        <Button type="submit">{decoded ? "Save vehicle" : "Save without decoding"}</Button>
      </form>
    </div>
  );
}
