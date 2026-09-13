import MechanicJobsList from "../_jobs-list";

export const metadata = { title: "Requests" };

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <MechanicJobsList title="Pending requests" href="/mechanic/requests" statuses={["REQUESTED"]} q={q} />;
}
