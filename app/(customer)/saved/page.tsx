import Link from "next/link";
import { EmptyState } from "@/components/ui/card";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { shopPhotoFor } from "@/lib/landing";

export const metadata = { title: "Saved shops" };

export default async function SavedShopsPage() {
  const session = await requireSession("CUSTOMER");
  const saved = await prisma.savedMechanic.findMany({
    where: { customerId: session.id },
    include: { mechanic: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-navy">Saved shops</h1>
      <p className="mt-2 text-sm text-muted">Shops you saved from a profile. Saving does not change ranking.</p>
      <div className="mt-6 space-y-3">
        {saved.length === 0 ? (
          <EmptyState title="No saved shops" body="Open a shop profile from Find a Shop when you want to keep it handy." />
        ) : (
          saved.map((item) => (
            <Link key={item.id} href={`/mechanics/${item.mechanic.slug}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shopPhotoFor(item.mechanic.slug)} alt="" className="h-14 w-16 rounded-xl object-cover" />
              <span>
                <span className="block font-semibold text-navy">{item.mechanic.businessName}</span>
                <span className="text-sm text-muted">
                  {item.mechanic.shopCity}, {item.mechanic.shopState}
                </span>
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
