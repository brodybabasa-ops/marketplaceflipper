import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { IngestButton } from "@/components/admin/IngestButton";

export const dynamic = "force-dynamic";

export default async function IngestionPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const jobs = await prisma.ingestionJob.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/admin" className="text-sm text-muted">
        ← Dashboard
      </Link>
      <div className="mt-4 flex items-end justify-between">
        <h1 className="font-[family-name:var(--font-instrument)] text-4xl">Ingestion</h1>
        <IngestButton />
      </div>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Found</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Failed</th>
              <th className="px-4 py-3">Error</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-border/70">
                <td className="px-4 py-3">{job.startedAt.toLocaleString()}</td>
                <td className="px-4 py-3">{job.source}</td>
                <td className="px-4 py-3">{job.status}</td>
                <td className="px-4 py-3">{job.listingsFound}</td>
                <td className="px-4 py-3">{job.listingsCreated}</td>
                <td className="px-4 py-3">{job.listingsUpdated}</td>
                <td className="px-4 py-3">{job.listingsFailed}</td>
                <td className="max-w-xs truncate px-4 py-3 text-muted">{job.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
