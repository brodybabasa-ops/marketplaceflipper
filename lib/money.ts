export function formatCents(cents: number, options?: { from?: boolean }) {
  const value = (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
  return options?.from ? `Starting at ${value}` : value;
}

export function dollarsToCents(value: string | number) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
