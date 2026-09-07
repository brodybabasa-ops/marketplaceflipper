import { redirect } from "next/navigation";

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const key of ["vehicle", "mechanic", "asset", "kind", "urgent", "q"] as const) {
    const value = params[key];
    const one = Array.isArray(value) ? value[0] : value;
    if (one) qs.set(key, one);
  }
  redirect(qs.size ? `/fix?${qs.toString()}` : "/fix");
}
