import { Field } from "@/components/ui/input";

export function VehicleMakeModelFields({
  makes,
  defaultModelId,
}: {
  makes: { id: string; name: string; models: { id: string; name: string }[] }[];
  defaultMakeId?: string;
  defaultModelId?: string;
}) {
  return (
    <Field label="Make and model">
      <select
        name="modelId"
        required
        defaultValue={defaultModelId ?? ""}
        size={8}
        className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-[#1b2430] outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
      >
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
      </select>
    </Field>
  );
}
