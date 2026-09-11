import { prisma } from "@/lib/db";
import { listMechanicsForMatching } from "@/services/mechanics";
import { matchMechanics, type MatchFilters } from "@/services/matching";
import { classifyProblem } from "@/services/problem-classifier";
import type { MechanicSort } from "@/services/ranking";
import type { ServiceCategory, ServiceMode } from "@prisma/client";

export async function searchMechanics(input: {
  q?: string;
  zip?: string;
  vehicle?: string;
  category?: string;
  make?: string;
  mode?: string;
  rating?: string;
  verified?: string;
  price?: string;
  distance?: string;
  sort?: string;
  day?: string;
}) {
  const rawLocation = input.zip?.trim() ?? "";
  const digits = rawLocation.replace(/\D/g, "");
  const originZip = digits.length >= 5 ? digits.slice(0, 5) : "";
  const cityQuery = rawLocation.split(",")[0]?.trim();
  const zip = originZip
    ? await prisma.zipCode.findUnique({ where: { zip: originZip } })
    : cityQuery
      ? await prisma.zipCode.findFirst({
          where: {
            OR: [
              { city: { equals: cityQuery, mode: "insensitive" } },
              { city: { contains: cityQuery, mode: "insensitive" } },
              { state: { contains: cityQuery, mode: "insensitive" } },
            ],
          },
        })
      : await prisma.zipCode.findUnique({ where: { zip: "84101" } });

  const category = input.category
    ? (input.category.toUpperCase() as ServiceCategory)
    : input.q
      ? classifyProblem(input.q)
      : undefined;

  const filters: MatchFilters = {
    origin: zip ? { latitude: zip.latitude, longitude: zip.longitude } : undefined,
    category,
    makeName: input.make || input.vehicle?.split(" ").slice(1, 2)[0],
    serviceMode: (input.mode as ServiceMode | "ANY" | undefined) ?? undefined,
    minRating: input.rating ? Number(input.rating) : undefined,
    verifiedOnly: input.verified === "1",
    maxPriceCents: input.price ? Number(input.price) * 100 : undefined,
    maxDistanceMiles: input.distance ? Number(input.distance) : undefined,
    availableDay: input.day?.toUpperCase(),
    sort: (input.sort as MechanicSort) || "recommended",
  };

  const matches = matchMechanics(await listMechanicsForMatching(), filters);
  return { matches, zip, category, filters };
}

export function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
