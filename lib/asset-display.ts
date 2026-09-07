import { formatMiles } from "@/lib/utils";

export type VehicleLabelSource = {
  year: number;
  make: { name: string } | string;
  model: { name: string } | string;
  nickname?: string | null;
  mileage?: number | null;
} | null | undefined;

export type AssetLabelSource = {
  year?: number | null;
  manufacturer?: string | null;
  model?: string | null;
  nickname?: string | null;
  usageValue?: number | null;
  usageUnit?: string | null;
  industry?: { name?: string | null; key?: string | null } | null;
  assetType?: { name?: string | null } | null;
} | null | undefined;

export function formatUsage(value: number | null | undefined, unit?: string | null) {
  if (value == null || Number.isNaN(value)) return "";
  const amount = Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  switch (unit) {
    case "MILES":
      return formatMiles(Math.round(value));
    case "KILOMETERS":
      return `${amount} km`;
    case "ENGINE_HOURS":
      return `${amount} engine hours`;
    case "OPERATING_HOURS":
      return `${amount} operating hours`;
    case "CYCLES":
      return `${amount} cycles`;
    case "CALENDAR_INTERVAL":
      return `${amount} months`;
    default:
      return `${amount} hours`;
  }
}

function makeName(make: { name: string } | string) {
  return typeof make === "string" ? make : make.name;
}

function modelName(model: { name: string } | string) {
  return typeof model === "string" ? model : model.name;
}

export function vehicleLabel(vehicle: VehicleLabelSource) {
  if (!vehicle) return "";
  return `${vehicle.year} ${makeName(vehicle.make)} ${modelName(vehicle.model)}`.trim();
}

export function assetLabel(asset: AssetLabelSource) {
  if (!asset) return "";
  const year = asset.year ? `${asset.year} ` : "";
  const name = [asset.manufacturer, asset.model].filter(Boolean).join(" ");
  return `${year}${name || asset.nickname || asset.assetType?.name || "Equipment"}`.trim();
}

export function jobAssetLabel(job: { vehicle?: VehicleLabelSource; asset?: AssetLabelSource }) {
  if (job.vehicle) return vehicleLabel(job.vehicle);
  if (job.asset) return assetLabel(job.asset);
  return "Asset";
}

export function jobUsageLabel(job: { vehicle?: VehicleLabelSource; asset?: AssetLabelSource }) {
  if (job.asset?.usageValue != null) return formatUsage(job.asset.usageValue, job.asset.usageUnit);
  if (job.vehicle?.mileage != null) return formatMiles(job.vehicle.mileage);
  return "";
}
