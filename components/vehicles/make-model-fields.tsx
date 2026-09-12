"use client";

import { Field, Select } from "@/components/ui/input";

export function VehicleMakeModelFields({
  makes,
}: {
  makes: { id: string; name: string; models: { id: string; name: string }[] }[];
  defaultMakeId?: string;
}) {
  return (
    <Field label="Make and model">
      <Select name="modelId" required defaultValue="">
        <option value="" disabled>
          Choose make and model
        </option>
        {makes.map((make) => (
          <optgroup key={make.id} label={make.name}>
            {make.models.map((model) => (
              <option key={model.id} value={model.id}>
                {make.name} {model.name}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
    </Field>
  );
}
