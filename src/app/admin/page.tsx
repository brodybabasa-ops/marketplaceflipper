import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { IngestButton } from "@/components/admin/IngestButton";
import { AppShell } from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalListings,
    newToday,
    activeListings,
    bySource,
    failedJobs,
    duplicates,
    avgDeal,
    searchVolume,
    userCount,
    savedSearches,
    alertVolume,
  ] = await Promise.all([
    prisma.listing.count(),
    prisma.listing.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.listing.count({ where: { listingStatus: "active" } }),
    prisma.listing.groupBy({ by: ["source"], _count: true }),
    prisma.ingestionJob.count({ where: { status: "failed" } }),
    prisma.duplicateFlag.count(),
    prisma.listing.aggregate({ _avg: { dealScore: true } }),
    prisma.searchEvent.count(),
    prisma.user.count(),
    prisma.savedSearch.count(),
    prisma.notification.count(),
  ]);

  const cards = [
    ["Total listings", totalListings],
    ["New today", newToday],
    ["Active", activeListings],
    ["Failed jobs", failedJobs],
    ["Duplicate flags", duplicates],
    ["Avg deal score", avgDeal._avg.dealScore ? Math.round(avgDeal._avg.dealScore) : "—"],
    ["Search volume", searchVolume],
    ["Users", userCount],
    ["Saved searches", savedSearches],
    ["Alerts", alertVolume],
  ] as const;

  return (
    <AppShell user={session}>
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold">Dashboard</h1>
        </div>
        <Link href="/admin/ingestion" className="text-sm text-muted hover:text-foreground">
          Ingestion status
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Listings by source</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {bySource.map((row) => (
            <li key={row.source} className="flex justify-between">
              <span className="capitalize">{row.source}</span>
              <span>{row._count}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <IngestButton />
        </div>
      </section>
    </div>
    </AppShell>
  );
}
