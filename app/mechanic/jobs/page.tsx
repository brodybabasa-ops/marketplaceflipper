import MechanicJobsList from "../_jobs-list";

export const metadata = { title: "Jobs" };

export default async function MechanicJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <MechanicJobsList title="Jobs" href="/mechanic/jobs" q={q} />;
}
