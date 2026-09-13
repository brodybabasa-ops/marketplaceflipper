import { prisma } from "@/lib/db";

export type VinDecodeResult = {
  vin: string;
  year?: number;
  makeId?: string;
  modelId?: string;
  makeName?: string;
  modelName?: string;
  error?: string;
};

type NhtsaRow = {
  ErrorCode?: string;
  Make?: string;
  Model?: string;
  ModelYear?: string;
};

export async function decodeVinToCatalog(vinRaw: string): Promise<VinDecodeResult> {
  const vin = vinRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (vin.length !== 17) {
    return { vin, error: "A VIN is 17 characters. For a HIN, pick make and model below." };
  }

  let row: NhtsaRow | undefined;
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (!response.ok) return { vin, error: "VIN lookup is unavailable right now." };
    const json = (await response.json()) as { Results?: NhtsaRow[] };
    row = json.Results?.[0];
  } catch {
    return { vin, error: "VIN lookup is unavailable right now." };
  }

  const makeName = String(row?.Make ?? "").trim();
  const modelName = String(row?.Model ?? "").trim();
  const year = Number(row?.ModelYear);
  if (!makeName || !modelName || !Number.isFinite(year) || year < 1980) {
    return { vin, error: "We couldn't match that VIN. Pick make and model below." };
  }

  const models = await prisma.vehicleModel.findMany({ include: { make: true } });
  const needleMake = makeName.toLowerCase();
  const needleModel = modelName.toLowerCase();
  const match =
    models.find((item) => item.make.name.toLowerCase() === needleMake && item.name.toLowerCase() === needleModel) ??
    models.find(
      (item) =>
        item.make.name.toLowerCase() === needleMake &&
        (needleModel.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(needleModel)),
    );

  if (!match) {
    return {
      vin,
      year,
      makeName,
      modelName,
      error: `Decoded ${year} ${makeName} ${modelName}, which isn't in the catalog yet. Pick the closest make and model.`,
    };
  }

  return {
    vin,
    year,
    makeId: match.makeId,
    modelId: match.id,
    makeName: match.make.name,
    modelName: match.name,
  };
}
