import { MechanicCard } from "@/components/mechanics/mechanic-card";
import { searchMechanics } from "@/services/search";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata = { title: "Mobile mechanics" };

export default async function MobileMechanicsPage() {
  const { matches } = await searchMechanics({ mode: "MOBILE", zip: "84041" });
  return (
    <MarketingShell
      title="Mobile"
      accent="mechanics."
      subtitle="Mechanics who can come to you. Still independent service providers — Pocket Mechanic is the marketplace, not the shop."
      wide
    >
      <div className="grid gap-4">
        {matches.map((mechanic) => (
          <MechanicCard key={mechanic.id} mechanic={mechanic} />
        ))}
      </div>
    </MarketingShell>
  );
}
