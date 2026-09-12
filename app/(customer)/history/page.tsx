import { EmptyState } from "@/components/ui/card";
import { ThemedBoard } from "@/components/layout/themed-board";
import { formatCents } from "@/lib/money";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "Repair history" };

export default async function HistoryPage() {
  const session = await requireSession("CUSTOMER");
  const vehicles = await prisma.vehicle.findMany({
    where: { customerId: session.id },
    include: {
      make: true,
      model: true,
      repairRecords: { include: { job: { include: { mechanicProfile: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  return (
    <ThemedBoard
      eyebrow="REPAIR HISTORY"
      title="What got"
      accent="Fixed."
      subtitle="A permanent record on the vehicle, not a paper invoice in the glovebox."
      script="Keep It Running."
      image="/landing/repairs-lifestyle.png"
    >
      <div className="space-y-8">
        {vehicles.length === 0 ? (
          <EmptyState title="No vehicles yet" body="Add a vehicle to start building history." />
        ) : (
          vehicles.map((vehicle) => (
            <section key={vehicle.id}>
              <h2 className="text-xl font-semibold text-navy">
                {vehicle.year} {vehicle.make.name} {vehicle.model.name}
              </h2>
              <div className="mt-3 space-y-3">
                {vehicle.repairRecords.length === 0 ? (
                  <p className="text-sm text-muted">No documented repairs yet.</p>
                ) : (
                  vehicle.repairRecords.map((record) => (
                    <article key={record.id} className="rounded-2xl border border-line bg-[#f7f9fc] p-4">
                      <p className="text-sm text-muted">
                        {record.createdAt.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "America/Denver" })}
                      </p>
                      <p className="font-semibold text-navy">{record.title}</p>
                      <p className="text-sm text-muted">{record.job.mechanicProfile.businessName}</p>
                      <p className="number mt-1 font-semibold">{formatCents(record.job.totalCents)}</p>
                      <a href={`/jobs/${record.jobId}`} className="mt-2 inline-block text-sm font-semibold text-[#2f7bff]">
                        View job
                      </a>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </ThemedBoard>
  );
}
