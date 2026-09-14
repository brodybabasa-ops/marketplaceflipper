import { notFound } from "next/navigation";
import { ShopJobPanel } from "@/components/shop-os/jobs-view";
import { requireSession } from "@/lib/guards";
import { getJobForUser } from "@/services/jobs";

export const metadata = { title: "Job" };

export default async function MechanicJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ panel?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const { id } = await params;
  const { panel } = await searchParams;
  const job = await getJobForUser(id, session.id, session.role);
  if (!job) notFound();
  return (
    <div className="mx-auto max-w-3xl px-5 py-5 lg:px-6">
      <ShopJobPanel job={job} panel={panel} sessionId={session.id} returnTo={`/mechanic/jobs/${job.id}`} />
    </div>
  );
}
