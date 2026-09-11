import { notFound } from "next/navigation";
import { MechanicCard } from "@/components/mechanics/mechanic-card";
import { US_STATES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { searchMechanics } from "@/services/search";
import { slugify } from "@/lib/utils";

export default async function NestedSeoPage({ params }: { params: Promise<{ slug: string; child: string }> }) {
  const { slug, child } = await params;
  const state = US_STATES.find((item) => item.slug === slug);
  if (state) {
    const zips = await prisma.zipCode.findMany({ where: { stateCode: state.code } });
    const city = zips.find((item) => slugify(item.city) === child);
    if (!city) notFound();
    const { matches } = await searchMechanics({ zip: city.zip });
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold text-navy">
          Mechanics in {city.city}, {state.code}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Local Pocket Mechanic partners serving {city.city}. Compare verified jobs, specialties, and transparent pricing.
        </p>
        <div className="mt-8 grid gap-4">
          {matches.map((mechanic) => (
            <MechanicCard key={mechanic.id} mechanic={mechanic} />
          ))}
        </div>
      </div>
    );
  }

  const make = await prisma.vehicleMake.findUnique({ where: { slug }, include: { models: true } });
  const model = make?.models.find((item) => item.slug === child);
  if (!make || !model) notFound();
    const { matches } = await searchMechanics({ make: make.name, zip: "84041" });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-navy">
        {make.name} {model.name} mechanics
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Mechanics who regularly work on {make.name} {model.name} vehicles. This is not a dealership directory — these are independent service providers.
      </p>
      <div className="mt-8 grid gap-4">
        {matches.map((mechanic) => (
          <MechanicCard key={mechanic.id} mechanic={mechanic} />
        ))}
      </div>
    </div>
  );
}
