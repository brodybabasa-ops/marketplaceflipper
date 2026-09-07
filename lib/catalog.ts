export const INDUSTRY_KEYS = [
  "AUTOMOTIVE",
  "MARINE",
  "POWERSPORTS",
  "RV",
  "COMMERCIAL_FLEET",
  "HEAVY_EQUIPMENT",
  "AGRICULTURAL",
  "SMALL_ENGINE",
] as const;

export type IndustryKey = (typeof INDUSTRY_KEYS)[number];

export type UsageUnitKey =
  | "MILES"
  | "KILOMETERS"
  | "ENGINE_HOURS"
  | "OPERATING_HOURS"
  | "CYCLES"
  | "CALENDAR_INTERVAL"
  | "OTHER";

export const INDUSTRIES: {
  key: IndustryKey;
  name: string;
  consumerLabel: string;
  intakePrompt: string;
  intakePlaceholder: string;
  usageUnit: UsageUnitKey;
  sortOrder: number;
}[] = [
  {
    key: "AUTOMOTIVE",
    name: "Automotive",
    consumerLabel: "vehicle",
    intakePrompt: "What’s going on with your vehicle?",
    intakePlaceholder: "My F-150 clicks when I turn left.",
    usageUnit: "MILES",
    sortOrder: 1,
  },
  {
    key: "MARINE",
    name: "Marine",
    consumerLabel: "boat",
    intakePrompt: "What’s going on with your boat?",
    intakePlaceholder: "My boat won't get on plane.",
    usageUnit: "ENGINE_HOURS",
    sortOrder: 2,
  },
  {
    key: "POWERSPORTS",
    name: "Powersports",
    consumerLabel: "machine",
    intakePrompt: "What’s going on with your machine?",
    intakePlaceholder: "My dirt bike is hard to start when hot.",
    usageUnit: "ENGINE_HOURS",
    sortOrder: 3,
  },
  {
    key: "RV",
    name: "RV",
    consumerLabel: "RV",
    intakePrompt: "What’s going on with your RV?",
    intakePlaceholder: "My slide won't retract.",
    usageUnit: "MILES",
    sortOrder: 4,
  },
  {
    key: "COMMERCIAL_FLEET",
    name: "Commercial / Fleet",
    consumerLabel: "fleet vehicle",
    intakePrompt: "What’s going on with this vehicle?",
    intakePlaceholder: "Delivery van has a no-start after overnight.",
    usageUnit: "MILES",
    sortOrder: 5,
  },
  {
    key: "HEAVY_EQUIPMENT",
    name: "Heavy Equipment",
    consumerLabel: "machine",
    intakePrompt: "What’s going on with this equipment?",
    intakePlaceholder: "My skid steer loses hydraulic pressure when warm.",
    usageUnit: "OPERATING_HOURS",
    sortOrder: 6,
  },
  {
    key: "AGRICULTURAL",
    name: "Agricultural",
    consumerLabel: "equipment",
    intakePrompt: "What’s going on with this equipment?",
    intakePlaceholder: "Tractor hydraulics are slow to lift.",
    usageUnit: "OPERATING_HOURS",
    sortOrder: 7,
  },
  {
    key: "SMALL_ENGINE",
    name: "Small Engine / Equipment",
    consumerLabel: "equipment",
    intakePrompt: "What’s going on with this equipment?",
    intakePlaceholder: "Generator won't stay running under load.",
    usageUnit: "OPERATING_HOURS",
    sortOrder: 8,
  },
];

export const ASSET_TYPES: { industry: IndustryKey; key: string; name: string }[] = [
  { industry: "AUTOMOTIVE", key: "CAR", name: "Car" },
  { industry: "AUTOMOTIVE", key: "TRUCK", name: "Truck" },
  { industry: "AUTOMOTIVE", key: "SUV", name: "SUV" },
  { industry: "AUTOMOTIVE", key: "VAN", name: "Van" },
  { industry: "AUTOMOTIVE", key: "DIESEL", name: "Diesel vehicle" },
  { industry: "AUTOMOTIVE", key: "EV", name: "EV" },
  { industry: "AUTOMOTIVE", key: "HYBRID", name: "Hybrid" },
  { industry: "AUTOMOTIVE", key: "PERFORMANCE", name: "Performance vehicle" },
  { industry: "AUTOMOTIVE", key: "CLASSIC", name: "Classic vehicle" },
  { industry: "AUTOMOTIVE", key: "COMMERCIAL", name: "Commercial vehicle" },
  { industry: "MARINE", key: "WAKE_BOAT", name: "Wake / surf boat" },
  { industry: "MARINE", key: "SKI_BOAT", name: "Ski boat" },
  { industry: "MARINE", key: "FISHING_BOAT", name: "Fishing boat" },
  { industry: "MARINE", key: "PONTOON", name: "Pontoon" },
  { industry: "MARINE", key: "CRUISER", name: "Cruiser" },
  { industry: "MARINE", key: "SAILBOAT", name: "Sailboat" },
  { industry: "MARINE", key: "PWC", name: "Personal watercraft" },
  { industry: "MARINE", key: "OUTBOARD", name: "Outboard-powered boat" },
  { industry: "MARINE", key: "STERNDRIVE", name: "Sterndrive boat" },
  { industry: "MARINE", key: "INBOARD", name: "Inboard boat" },
  { industry: "MARINE", key: "BOAT_TRAILER", name: "Boat trailer" },
  { industry: "POWERSPORTS", key: "MOTORCYCLE", name: "Motorcycle" },
  { industry: "POWERSPORTS", key: "DIRT_BIKE", name: "Dirt bike" },
  { industry: "POWERSPORTS", key: "ATV", name: "ATV" },
  { industry: "POWERSPORTS", key: "UTV", name: "UTV / side-by-side" },
  { industry: "POWERSPORTS", key: "SNOWMOBILE", name: "Snowmobile" },
  { industry: "POWERSPORTS", key: "ADVENTURE", name: "Adventure motorcycle" },
  { industry: "POWERSPORTS", key: "DUAL_SPORT", name: "Dual-sport" },
  { industry: "RV", key: "MOTORHOME", name: "Motorhome" },
  { industry: "RV", key: "TRAVEL_TRAILER", name: "Travel trailer" },
  { industry: "RV", key: "FIFTH_WHEEL", name: "Fifth wheel" },
  { industry: "RV", key: "TOY_HAULER", name: "Toy hauler" },
  { industry: "RV", key: "TRUCK_CAMPER", name: "Truck camper" },
  { industry: "RV", key: "CAMPER_VAN", name: "Camper van" },
  { industry: "RV", key: "POPUP", name: "Pop-up camper" },
  { industry: "COMMERCIAL_FLEET", key: "FLEET_VEHICLE", name: "Fleet vehicle" },
  { industry: "COMMERCIAL_FLEET", key: "SERVICE_TRUCK", name: "Service truck" },
  { industry: "COMMERCIAL_FLEET", key: "DELIVERY", name: "Delivery vehicle" },
  { industry: "COMMERCIAL_FLEET", key: "COMMERCIAL_VAN", name: "Commercial van" },
  { industry: "COMMERCIAL_FLEET", key: "TRAILER", name: "Commercial trailer" },
  { industry: "HEAVY_EQUIPMENT", key: "EXCAVATOR", name: "Excavator" },
  { industry: "HEAVY_EQUIPMENT", key: "LOADER", name: "Loader" },
  { industry: "HEAVY_EQUIPMENT", key: "SKID_STEER", name: "Skid steer" },
  { industry: "HEAVY_EQUIPMENT", key: "BACKHOE", name: "Backhoe" },
  { industry: "HEAVY_EQUIPMENT", key: "DOZER", name: "Dozer" },
  { industry: "HEAVY_EQUIPMENT", key: "FORKLIFT", name: "Forklift" },
  { industry: "HEAVY_EQUIPMENT", key: "TELEHANDLER", name: "Telehandler" },
  { industry: "AGRICULTURAL", key: "TRACTOR", name: "Tractor" },
  { industry: "AGRICULTURAL", key: "HARVEST", name: "Harvest equipment" },
  { industry: "AGRICULTURAL", key: "UTILITY", name: "Utility equipment" },
  { industry: "SMALL_ENGINE", key: "GENERATOR", name: "Generator" },
  { industry: "SMALL_ENGINE", key: "PRESSURE_WASHER", name: "Pressure washer" },
  { industry: "SMALL_ENGINE", key: "LAWN", name: "Lawn equipment" },
  { industry: "SMALL_ENGINE", key: "COMMERCIAL_MOWER", name: "Commercial mower" },
  { industry: "SMALL_ENGINE", key: "SNOW_BLOWER", name: "Snow blower" },
];

export const TAXONOMY: { industry: IndustryKey; key: string; label: string; helper: string }[] = [
  { industry: "AUTOMOTIVE", key: "BRAKES", label: "Brakes", helper: "Grinding, shaking, or warning lights when you stop" },
  { industry: "AUTOMOTIVE", key: "ENGINE", label: "Engine", helper: "Rough running, smoke, or loss of power" },
  { industry: "AUTOMOTIVE", key: "TRANSMISSION", label: "Transmission", helper: "Slipping or delayed shifting" },
  { industry: "AUTOMOTIVE", key: "ELECTRICAL", label: "Electrical", helper: "Lights, sensors, or electronics" },
  { industry: "AUTOMOTIVE", key: "SUSPENSION", label: "Suspension", helper: "Bouncing or clunks" },
  { industry: "AUTOMOTIVE", key: "MAINTENANCE", label: "Maintenance", helper: "Oil, filters, and regular service" },
  { industry: "AUTOMOTIVE", key: "DIAGNOSTICS", label: "Diagnostics", helper: "Unknown problem or warning light" },
  { industry: "MARINE", key: "ANNUAL_SERVICE", label: "Annual service", helper: "Seasonal service and inspection" },
  { industry: "MARINE", key: "WINTERIZATION", label: "Winterization", helper: "Winterize or dewinterize" },
  { industry: "MARINE", key: "IMPELLER", label: "Impeller", helper: "Cooling water pump / impeller" },
  { industry: "MARINE", key: "ENGINE", label: "Engine", helper: "Outboard, sterndrive, or inboard" },
  { industry: "MARINE", key: "SURF_SYSTEM", label: "Surf system", helper: "Ballast, surf, or wake system" },
  { industry: "MARINE", key: "ELECTRICAL", label: "Electrical", helper: "Batteries, charging, or 12V" },
  { industry: "MARINE", key: "TRAILER", label: "Trailer", helper: "Bearings, lights, or bunks" },
  { industry: "POWERSPORTS", key: "ENGINE", label: "Engine", helper: "Top end, bottom end, or no-start" },
  { industry: "POWERSPORTS", key: "SUSPENSION", label: "Suspension", helper: "Forks, shock, or linkage" },
  { industry: "POWERSPORTS", key: "ELECTRICAL", label: "Electrical", helper: "Starting, charging, or ignition" },
  { industry: "POWERSPORTS", key: "DRIVELINE", label: "Chain / clutch", helper: "Chain, sprockets, clutch, or belt" },
  { industry: "POWERSPORTS", key: "MAINTENANCE", label: "Maintenance", helper: "Oil, filters, and fluids" },
  { industry: "RV", key: "CHASSIS", label: "Chassis", helper: "Engine, brakes, or running gear" },
  { industry: "RV", key: "GENERATOR", label: "Generator", helper: "Onboard generator" },
  { industry: "RV", key: "HVAC", label: "HVAC", helper: "Roof AC or furnace" },
  { industry: "RV", key: "SLIDES", label: "Slides", helper: "Slide-outs and leveling" },
  { industry: "RV", key: "PLUMBING", label: "Plumbing", helper: "Water, tanks, or leaks" },
  { industry: "RV", key: "ELECTRICAL", label: "Electrical", helper: "House batteries or converters" },
  { industry: "HEAVY_EQUIPMENT", key: "ENGINE", label: "Engine", helper: "Power, smoke, or no-start" },
  { industry: "HEAVY_EQUIPMENT", key: "HYDRAULICS", label: "Hydraulics", helper: "Pressure, drift, or leaks" },
  { industry: "HEAVY_EQUIPMENT", key: "UNDERCARRIAGE", label: "Undercarriage", helper: "Tracks, rollers, or final drive" },
  { industry: "HEAVY_EQUIPMENT", key: "ELECTRICAL", label: "Electrical", helper: "Machine electrical and sensors" },
  { industry: "HEAVY_EQUIPMENT", key: "PM", label: "Preventive maintenance", helper: "Scheduled PM" },
  { industry: "AGRICULTURAL", key: "ENGINE", label: "Engine", helper: "Tractor or harvest power" },
  { industry: "AGRICULTURAL", key: "HYDRAULICS", label: "Hydraulics", helper: "Lift, loaders, or remotes" },
  { industry: "AGRICULTURAL", key: "PM", label: "Preventive maintenance", helper: "Seasonal service" },
  { industry: "SMALL_ENGINE", key: "ENGINE", label: "Engine", helper: "Won't start or won't stay running" },
  { industry: "SMALL_ENGINE", key: "FUEL", label: "Fuel system", helper: "Carburetor or injection" },
  { industry: "SMALL_ENGINE", key: "MAINTENANCE", label: "Maintenance", helper: "Tune-up and seasonal service" },
  { industry: "COMMERCIAL_FLEET", key: "BRAKES", label: "Brakes", helper: "Fleet brake service" },
  { industry: "COMMERCIAL_FLEET", key: "ENGINE", label: "Engine", helper: "Diesel or gas fleet power" },
  { industry: "COMMERCIAL_FLEET", key: "PM", label: "Preventive maintenance", helper: "Fleet PM intervals" },
];

export const INSPECTION_TEMPLATES: {
  industry: IndustryKey;
  key: string;
  name: string;
  kind: "STANDARD" | "PPI" | "ANNUAL" | "FLEET_PM";
  sections: string[];
}[] = [
  {
    industry: "AUTOMOTIVE",
    key: "AUTO_DVI",
    name: "Automotive inspection",
    kind: "STANDARD",
    sections: ["Engine", "Brakes", "Suspension", "Tires", "Battery", "Fluids", "Lights"],
  },
  {
    industry: "AUTOMOTIVE",
    key: "AUTO_PPI",
    name: "Automotive pre-purchase inspection",
    kind: "PPI",
    sections: ["Body", "Frame", "Engine", "Transmission", "Brakes", "Tires", "Electronics"],
  },
  {
    industry: "MARINE",
    key: "MARINE_ANNUAL",
    name: "Marine annual inspection",
    kind: "ANNUAL",
    sections: ["Engine", "Impeller", "Electrical", "Batteries", "Trailer", "Safety gear"],
  },
  {
    industry: "MARINE",
    key: "BOAT_PPI",
    name: "Boat pre-purchase inspection",
    kind: "PPI",
    sections: ["Hull", "Engine", "Drive", "Electrical", "Trailer", "Systems"],
  },
  {
    industry: "POWERSPORTS",
    key: "MOTO_INSPECTION",
    name: "Motorcycle / UTV inspection",
    kind: "STANDARD",
    sections: ["Engine", "Suspension", "Brakes", "Driveline", "Tires", "Electrical"],
  },
  {
    industry: "RV",
    key: "RV_INSPECTION",
    name: "RV inspection",
    kind: "STANDARD",
    sections: ["Chassis", "Engine", "Generator", "HVAC", "Slides", "Plumbing", "Electrical", "Roof"],
  },
  {
    industry: "HEAVY_EQUIPMENT",
    key: "HEAVY_INSPECTION",
    name: "Heavy equipment inspection",
    kind: "STANDARD",
    sections: ["Engine", "Hydraulics", "Electrical", "Undercarriage", "Final drive", "Attachments"],
  },
];

export const MAINTENANCE_RULES: {
  industry: IndustryKey;
  title: string;
  intervalValue: number;
  intervalUnit: UsageUnitKey;
  taxonomyKey: string;
}[] = [
  { industry: "AUTOMOTIVE", title: "Oil change", intervalValue: 5000, intervalUnit: "MILES", taxonomyKey: "MAINTENANCE" },
  { industry: "MARINE", title: "Impeller service", intervalValue: 100, intervalUnit: "ENGINE_HOURS", taxonomyKey: "IMPELLER" },
  { industry: "MARINE", title: "Annual service", intervalValue: 12, intervalUnit: "CALENDAR_INTERVAL", taxonomyKey: "ANNUAL_SERVICE" },
  { industry: "POWERSPORTS", title: "Oil change", intervalValue: 10, intervalUnit: "ENGINE_HOURS", taxonomyKey: "MAINTENANCE" },
  { industry: "HEAVY_EQUIPMENT", title: "Hydraulic service", intervalValue: 500, intervalUnit: "OPERATING_HOURS", taxonomyKey: "HYDRAULICS" },
  { industry: "RV", title: "Roof inspection", intervalValue: 12, intervalUnit: "CALENDAR_INTERVAL", taxonomyKey: "CHASSIS" },
];

export const REVENUE_STREAMS = [
  { key: "MARKETPLACE_FEE", name: "Marketplace transaction fees", status: "ACTIVE" },
  { key: "PROVIDER_SAAS", name: "Provider subscription", status: "ACTIVE" },
  { key: "PAYMENTS", name: "Payment economics", status: "ACTIVE" },
  { key: "PPI", name: "Pre-purchase inspections", status: "READY" },
  { key: "FINANCING", name: "Financing referrals", status: "PLANNED" },
  { key: "PARTS", name: "Parts procurement", status: "PLANNED" },
  { key: "ASSET_REPORTS", name: "Verified service reports", status: "PLANNED" },
  { key: "FLEET", name: "Fleet subscriptions", status: "PLANNED" },
  { key: "ROADSIDE", name: "Roadside / towing", status: "PLANNED" },
] as const;

export function industryByKey(key: string) {
  return INDUSTRIES.find((item) => item.key === key) ?? INDUSTRIES[0];
}

export function garageHeadline(industryKeys: string[]) {
  const unique = [...new Set(industryKeys)];
  if (unique.length <= 1 && (unique[0] ?? "AUTOMOTIVE") === "AUTOMOTIVE") {
    return { title: "My Garage", body: "Your vehicles. Your service. All in one place.", addLabel: "Add vehicle" };
  }
  return {
    title: "My Garage",
    body: "One place for everything you own that needs to be fixed.",
    addLabel: "Add to garage",
  };
}
