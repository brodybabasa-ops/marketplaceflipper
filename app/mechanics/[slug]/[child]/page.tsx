import { notFound } from "next/navigation";
import { MechanicCard } from "@/components/mechanics/mechanic-card";
import { US_STATES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { searchMechanics } from "@/services/search";
import { slugify } from "@/lib/utils";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export default async function NestedSeoPage({ params }: { params: Promise<{ slug: string; child: string }> }) {
  const { slug, child } = await params;
  const state = US_STATES.find((item) => item.slug === slug);
  if (state) {
    const zips = await prisma.zipCode.findMany({ where: { stateCode: state.code } });
    const city = zips.find((item) => slugify(item.city) === child);
    if (!city) notFound();
    const { matches } = await searchMechanics({ zip: city.zip });
    return (
      <MarketingShell
        title={`Mechanics in ${city.city},`}
        accent={state.code}
        subtitle={`Local Pocket Mechanic partners serving ${city.city}. Compare verified jobs, specialties, and transparent pricing.`}
        image="/landing/shop-1.png"
        script="Find the Right Shop."
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

  const make = await prisma.vehicleMake.findUnique({ where: { slug }, include: { models: true } });
  const model = make?.models.find((item) => item.slug === child);
  if (!make || !model) notFound();
  const { matches } = await searchMechanics({ make: make.name, zip: "84041" });
  return (
    <MarketingShell
      title={`${make.name} ${model.name}`}
      accent="mechanics."
      subtitle={`Mechanics who regularly work on ${make.name} ${model.name} vehicles. This is not a dealership directory — these are independent service providers.`}
      image="/landing/cat-automotive.png"
      script="Find the Right Shop."
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
