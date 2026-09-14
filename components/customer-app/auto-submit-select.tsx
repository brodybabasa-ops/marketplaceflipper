"use client";

export function AutoSubmitSelect({
  name,
  defaultValue,
  children,
  className,
}: {
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
      className={className}
    >
      {children}
    </select>
  );
}
