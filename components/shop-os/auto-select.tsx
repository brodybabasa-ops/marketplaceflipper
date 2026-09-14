"use client";

export function ShopAutoSelect({
  name,
  action,
  hidden,
  value,
  options,
}: {
  name: string;
  action: string;
  hidden: Record<string, string | undefined>;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <form action={action}>
      {Object.entries(hidden).map(([key, item]) =>
        item ? <input key={key} type="hidden" name={key} value={item} /> : null,
      )}
      <select
        name={name}
        defaultValue={value}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-xl border border-[#e6eef6] bg-white px-3 text-[13px] font-semibold text-[#102033]"
      >
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}
