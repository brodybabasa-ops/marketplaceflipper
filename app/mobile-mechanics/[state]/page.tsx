import { US_STATES } from "@/lib/constants";
import { notFound } from "next/navigation";
import { MechanicCard } from "@/components/mechanics/mechanic-card";
import { searchMechanics } from "@/services/search";

export default async function MobileMechanicsStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const match = US_STATES.find((item) => item.slug === state);
  if (!match) notFound();
  const { matches } = await searchMechanics({ mode: "MOBILE", zip: match.code === "UT" ? "84101" : undefined });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-navy">Mobile mechanics in {match.name}</h1>
      <p className="mt-3 max-w-2xl text-muted">Independent mobile technicians available through Pocket Mechanic in {match.name}.</p>
      <div className="mt-8 grid gap-4">
        {matches.map((mechanic) => (
          <MechanicCard key={mechanic.id} mechanic={mechanic} />
        ))}
      </div>
    </div>
  );
}
