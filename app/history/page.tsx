import Link from "next/link";
import { CustomerAppNav } from "@/components/layout/app-nav";
import { Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { assetLabel, vehicleLabel } from "@/lib/asset-display";

export const metadata = { title: "Repair history" };

export default async function HistoryPage() {
  const session = await requireSession("CUSTOMER");
  const assets = await prisma.asset.findMany({
    where: { ownerId: session.id },
    include: {
      industry: true,
      vehicle: { include: { make: true, model: true } },
      repairRecords: {
        include: {
          job: {
            include: {
              mechanicProfile: true,
              photos: true,
              payments: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const mixed = new Set(assets.map((item) => item.industry.key)).size > 1;
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <CustomerAppNav current="/history" />
      <h1 className="text-3xl font-bold text-ink">Repair history</h1>
      <p className="mt-2 text-sm text-muted">
        {mixed ? "One service record for everything you own." : "A permanent record on the vehicle, not a paper invoice in the glovebox."}
      </p>
      <div className="mt-8 space-y-8">
        {assets.length === 0 ? (
          <EmptyState title="No service history yet" body="Completed Pocket Mechanic repairs land here, including photos, invoices, and warranties.">
            <Button asChild>
              <Link href="/vehicles">Open garage</Link>
            </Button>
          </EmptyState>
        ) : (
          assets.map((asset) => (
            <section key={asset.id}>
              <h2 className="text-xl font-semibold text-ink">
                {asset.vehicle ? vehicleLabel(asset.vehicle) : assetLabel(asset)}
              </h2>
              {mixed ? <p className="text-xs uppercase tracking-wide text-muted">{asset.industry.name}</p> : null}
              <div className="mt-3 space-y-3">
                {asset.repairRecords.length === 0 ? (
                  <EmptyState title="No documented repairs yet" body="When a Pocket Mechanic job is completed, the record stays with this asset.">
                    <Button asChild>
                      <Link href={`/fix?asset=${asset.id}`}>Fix It</Link>
                    </Button>
                  </EmptyState>
                ) : (
                  asset.repairRecords.map((record) => {
                    const payment = record.job.payments[0];
                    return (
                      <Link key={record.id} href={`/jobs/${record.jobId}`} className="block">
                        <Card className="p-4">
                          <p className="text-sm text-muted">
                            {record.createdAt.toLocaleString("en-US", { month: "short", year: "numeric" })}
                          </p>
                          <p className="font-semibold text-ink">{record.title}</p>
                          <p className="text-sm text-muted">{record.job.mechanicProfile.businessName}</p>
                          <p className="number mt-1 font-semibold">{formatCents(record.job.totalCents)}</p>
                          <p className="mt-1 text-xs capitalize text-muted">
                            Payment {record.job.paymentStatus.toLowerCase()}
                            {payment ? ` · ${formatCents(payment.amountCents)} via ${payment.provider}` : ""}
                          </p>
                          {record.job.photos.length ? (
                            <div className="mt-3 flex gap-2 overflow-x-auto">
                              {record.job.photos.slice(0, 4).map((photo) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={photo.id}
                                  src={photo.url}
                                  alt={photo.caption ?? photo.kind}
                                  className="h-16 w-24 rounded-lg object-cover"
                                />
                              ))}
                            </div>
                          ) : null}
                        </Card>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
