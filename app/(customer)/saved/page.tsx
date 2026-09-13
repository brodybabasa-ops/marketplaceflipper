import { EmptyState } from "@/components/ui/card";
import { ThemedBoard, BoardLink } from "@/components/layout/themed-board";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { shopPhotoFor } from "@/lib/landing";
import { toggleSavedShopAction } from "@/app/actions/marketplace";

export const metadata = { title: "Saved shops" };

export default async function SavedShopsPage() {
  const session = await requireSession("CUSTOMER");
  const saved = await prisma.savedMechanic.findMany({
    where: { customerId: session.id },
    include: { mechanic: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <ThemedBoard
      eyebrow="SAVED SHOPS"
      title="Shops you"
      accent="Keep."
      subtitle="Saving a shop does not change ranking. It just keeps them handy."
      script="Find the Right Shop."
      image="/landing/shop-marine.png"
    >
      <div className="space-y-3">
        {saved.length === 0 ? (
          <EmptyState title="No saved shops" body="Open a shop profile from Find a Shop when you want to keep it handy." />
        ) : (
          saved.map((item) => (
            <div key={item.id} className="flex items-stretch gap-2">
              <div className="min-w-0 flex-1">
                <BoardLink href={`/mechanics/${item.mechanic.slug}`}>
                  <span className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shopPhotoFor(item.mechanic.slug)} alt="" className="h-14 w-16 rounded-xl object-cover" />
                    <span>
                      <span className="block font-semibold text-navy">{item.mechanic.businessName}</span>
                      <span className="text-sm text-muted">
                        {item.mechanic.shopCity}, {item.mechanic.shopState}
                      </span>
                    </span>
                  </span>
                </BoardLink>
              </div>
              <form action={toggleSavedShopAction} className="flex items-center">
                <input type="hidden" name="mechanicProfileId" value={item.mechanicProfileId} />
                <input type="hidden" name="slug" value={item.mechanic.slug} />
                <input type="hidden" name="returnTo" value="/saved" />
                <Button type="submit" variant="secondary" name="unsaveShop">
                  Remove
                </Button>
              </form>
            </div>
          ))
        )}
      </div>
    </ThemedBoard>
  );
}
