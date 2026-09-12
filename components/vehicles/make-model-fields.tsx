import { Field, Input } from "@/components/ui/input";

export function VehicleMakeModelFields({
  makes,
}: {
  makes: { id: string; name: string; models: { id: string; name: string }[] }[];
  defaultMakeId?: string;
}) {
  const options = makes.flatMap((make) =>
    make.models.map((model) => ({
      id: model.id,
      label: `${make.name} ${model.name}`,
    })),
  );
  return (
    <Field label="Make and model">
      <Input
        name="modelLabel"
        list="vehicle-models"
        required
        placeholder="Yamaha FX Cruiser"
        autoComplete="off"
      />
      <datalist id="vehicle-models">
        {options.map((option) => (
          <option key={option.id} value={option.label} />
        ))}
      </datalist>
      <p className="mt-1 text-xs text-muted">Type the make and model, then pick it from the list.</p>
    </Field>
  );
}
