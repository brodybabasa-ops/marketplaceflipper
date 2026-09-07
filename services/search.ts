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
  industry?: string;
  request?: string;
  asset?: string;
}) {
  const request = input.request
    ? await prisma.serviceRequest.findUnique({
        where: { id: input.request },
        include: { industry: true, asset: { include: { industry: true } } },
      })
    : null;

  const originZip = (input.zip || request?.zip)?.replace(/\D/g, "").slice(0, 5);
  const zip = originZip
    ? await prisma.zipCode.findUnique({ where: { zip: originZip } })
    : input.zip
      ? await prisma.zipCode.findFirst({
          where: { OR: [{ city: { contains: input.zip, mode: "insensitive" } }, { state: { contains: input.zip, mode: "insensitive" } }] },
        })
      : await prisma.zipCode.findUnique({ where: { zip: "84101" } });

  let industryKey = input.industry?.toUpperCase() || "AUTOMOTIVE";
  if (request) {
    industryKey = request.industry?.key ?? request.asset?.industry.key ?? industryKey;
  } else if (input.asset) {
    const asset = await prisma.asset.findUnique({ where: { id: input.asset }, include: { industry: true } });
    if (asset) industryKey = asset.industry.key;
  }

  const queryText = input.q || request?.problemText;
  const category = input.category
    ? (input.category.toUpperCase() as ServiceCategory)
    : request?.category
      ? request.category
      : queryText
        ? classifyProblem(queryText, industryKey)
        : undefined;

  const filters: MatchFilters = {
    origin: zip ? { latitude: zip.latitude, longitude: zip.longitude } : undefined,
    category,
    makeName: input.make || request?.asset?.manufacturer || input.vehicle?.split(" ").slice(1, 2)[0],
    serviceMode: (input.mode as ServiceMode | "ANY" | undefined) ?? undefined,
    minRating: input.rating ? Number(input.rating) : undefined,
    verifiedOnly: input.verified === "1",
    maxPriceCents: input.price ? Number(input.price) * 100 : undefined,
    maxDistanceMiles: input.distance ? Number(input.distance) : undefined,
    availableDay: input.day?.toUpperCase(),
    sort: (input.sort as MechanicSort) || "recommended",
    industryKey,
  };

  const matches = matchMechanics(await listMechanicsForMatching(), filters);
  return { matches, zip, category, filters, industryKey, request };
}

export function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
