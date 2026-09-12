"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, Select } from "@/components/ui/input";

export function VehicleMakeModelFields({
  makes,
  defaultMakeId,
}: {
  makes: { id: string; name: string; models: { id: string; name: string }[] }[];
  defaultMakeId?: string;
}) {
  const [makeId, setMakeId] = useState(defaultMakeId ?? makes[0]?.id ?? "");
  const models = useMemo(
    () => makes.find((item) => item.id === makeId)?.models ?? makes[0]?.models ?? [],
    [makeId, makes],
  );
  const [modelId, setModelId] = useState(models[0]?.id ?? "");

  useEffect(() => {
    if (!models.some((model) => model.id === modelId)) {
      setModelId(models[0]?.id ?? "");
    }
  }, [models, modelId]);

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
        <Select name="modelId" value={modelId} onChange={(event) => setModelId(event.target.value)} required>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
