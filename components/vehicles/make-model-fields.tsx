"use client";

import { useState } from "react";
import { Field, Select } from "@/components/ui/input";

export function VehicleMakeModelFields({
  makes,
  defaultMakeId,
}: {
  makes: { id: string; name: string; models: { id: string; name: string }[] }[];
  defaultMakeId?: string;
}) {
  const [makeId, setMakeId] = useState(defaultMakeId ?? makes[0]?.id ?? "");
  const make = makes.find((item) => item.id === makeId) ?? makes[0];
  return (
    <>
      <Field label="Make">
        <Select name="makeId" value={makeId} onChange={(event) => setMakeId(event.target.value)} required>
          {makes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Model">
        <Select name="modelId" key={make?.id} defaultValue={make?.models[0]?.id} required>
          {(make?.models ?? []).map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
