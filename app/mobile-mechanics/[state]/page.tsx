import { US_STATES } from "@/lib/constants";
import { notFound } from "next/navigation";
import { MechanicCard } from "@/components/mechanics/mechanic-card";
import { searchMechanics } from "@/services/search";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export default async function MobileMechanicsStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const match = US_STATES.find((item) => item.slug === state);
  if (!match) notFound();
  const { matches } = await searchMechanics({ mode: "MOBILE", zip: match.code === "UT" ? "84041" : undefined });
  return (
    <MarketingShell
      title="Mobile mechanics in"
      accent={`${match.name}.`}
      subtitle={`Independent mobile technicians available through Pocket Mechanic in ${match.name}.`}
      image="/landing/hero-truck.png"
      script="We'll get you there."
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
