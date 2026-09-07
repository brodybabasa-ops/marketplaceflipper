import Link from "next/link";
import { CustomerAppNav } from "@/components/layout/app-nav";
import { MechanicCard } from "@/components/mechanics/mechanic-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { toggleSavedMechanicAction } from "@/app/actions/phase2";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { toMatchableMechanic } from "@/services/mechanics";
import { haversineMiles } from "@/lib/geo";

export const metadata = { title: "Saved mechanics" };

export default async function SavedPage() {
  const session = await requireSession("CUSTOMER");
  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.id } });
  const saved = await prisma.savedMechanic.findMany({
    where: { customerId: session.id },
    include: {
      mechanic: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          specialties: true,
          makeExpertise: { include: { make: true } },
          availability: true,
          industries: { include: { industry: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <CustomerAppNav current="/saved" />
      <h1 className="text-3xl font-bold text-ink">Saved mechanics</h1>
      <p className="mt-2 text-sm text-muted">Keep the people you'd call again. Favorites are yours — they do not change ranking.</p>
      <div className="mt-6 space-y-4">
        {saved.length === 0 ? (
          <EmptyState title="No saved mechanics yet" body="Save someone from their profile when you want to find them later.">
            <Button asChild>
              <Link href="/mechanics">Find a mechanic</Link>
            </Button>
          </EmptyState>
        ) : (
          saved.map((item) => {
            const mechanic = toMatchableMechanic(item.mechanic);
            const origin = profile?.latitude && profile.longitude ? { latitude: profile.latitude, longitude: profile.longitude } : null;
            return (
              <div key={item.id}>
                <MechanicCard
                  mechanic={{
                    ...mechanic,
                    distanceMiles: origin ? haversineMiles(origin, mechanic) : 0,
                    reasons: [],
                    isBestMatch: false,
                  }}
                />
                <form action={toggleSavedMechanicAction} className="mt-2">
                  <input type="hidden" name="mechanicProfileId" value={item.mechanicProfileId} />
                  <Button type="submit" variant="ghost" size="sm">
                    Remove
                  </Button>
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
