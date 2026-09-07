import { MechanicCard } from "@/components/mechanics/mechanic-card";
import { searchMechanics } from "@/services/search";

export const metadata = { title: "Mobile mechanics" };

export default async function MobileMechanicsPage() {
  const { matches } = await searchMechanics({ mode: "MOBILE", zip: "84101" });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-ink">Mobile mechanics</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Mechanics who can come to you. Still independent service providers — Pocket Mechanic is the marketplace, not the shop.
      </p>
      <div className="mt-8 grid gap-4">
        {matches.map((mechanic) => (
          <MechanicCard key={mechanic.id} mechanic={mechanic} />
        ))}
      </div>
    </div>
  );
}
