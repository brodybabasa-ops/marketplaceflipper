"use client";

import { useMemo, useState } from "react";
import { Field, Input } from "@/components/ui/input";

type Make = { id: string; name: string; models: { id: string; name: string }[] };

export function VehicleMakeModelFields({
  makes,
}: {
  makes: Make[];
  defaultMakeId?: string;
}) {
  const options = useMemo(
    () =>
      makes.flatMap((make) =>
        make.models.map((model) => ({
          id: model.id,
          label: `${make.name} ${model.name}`,
        })),
      ),
    [makes],
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<(typeof options)[number] | null>(null);
  const matches = options
    .filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 12);

  return (
    <Field label="Make and model">
      <input type="hidden" name="modelId" value={selected?.id ?? ""} required />
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelected(null);
        }}
        placeholder="Start typing, e.g. Yamaha FX"
        autoComplete="off"
      />
      {selected ? <p className="mt-1 text-xs text-muted">Selected: {selected.label}</p> : null}
      {!selected ? (
        <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-line bg-white">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">No matching machines</li>
          ) : (
            matches.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-[#1b2430] hover:bg-[#f4f7fb]"
                  onClick={() => {
                    setSelected(option);
                    setQuery(option.label);
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </Field>
  );
}
