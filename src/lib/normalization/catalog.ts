export type VehicleModel = {
  name: string;
  aliases: string[];
  bodyStyle: string;
  trims: string[];
  engines?: string[];
};

export type VehicleMake = {
  name: string;
  aliases: string[];
  models: VehicleModel[];
};

export const VEHICLE_CATALOG: VehicleMake[] = [
  {
    name: "Ford",
    aliases: ["ford"],
    models: [
      { name: "F-150", aliases: ["f150", "f-150", "f 150"], bodyStyle: "Pickup", trims: ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Raptor", "Tremor"], engines: ["2.7L EcoBoost", "3.5L EcoBoost", "5.0L V8", "3.5L PowerBoost"] },
      { name: "F-250", aliases: ["f250", "f-250", "f 250", "super duty"], bodyStyle: "Pickup", trims: ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited"], engines: ["6.7L Power Stroke", "6.2L V8", "7.3L V8"] },
      { name: "F-350", aliases: ["f350", "f-350", "f 350"], bodyStyle: "Pickup", trims: ["XL", "XLT", "Lariat", "King Ranch", "Platinum"], engines: ["6.7L Power Stroke", "7.3L V8"] },
      { name: "Ranger", aliases: ["ranger"], bodyStyle: "Pickup", trims: ["XL", "XLT", "Lariat", "Raptor"] },
      { name: "Bronco", aliases: ["bronco"], bodyStyle: "SUV", trims: ["Base", "Big Bend", "Black Diamond", "Outer Banks", "Badlands", "Wildtrak", "Raptor"] },
      { name: "Mustang", aliases: ["mustang"], bodyStyle: "Coupe", trims: ["EcoBoost", "GT", "Mach 1", "Dark Horse", "Shelby GT350", "Shelby GT500"] },
      { name: "Explorer", aliases: ["explorer"], bodyStyle: "SUV", trims: ["Base", "XLT", "Limited", "ST", "Platinum"] },
      { name: "Escape", aliases: ["escape"], bodyStyle: "SUV", trims: ["S", "SE", "SEL", "Titanium"] },
      { name: "Maverick", aliases: ["maverick"], bodyStyle: "Pickup", trims: ["XL", "XLT", "Lariat", "Tremor"] },
      { name: "Expedition", aliases: ["expedition"], bodyStyle: "SUV", trims: ["XLT", "Limited", "King Ranch", "Platinum"] },
    ],
  },
  {
    name: "Chevrolet",
    aliases: ["chevrolet", "chevy"],
    models: [
      { name: "Silverado 1500", aliases: ["silverado 1500", "silverado", "1500"], bodyStyle: "Pickup", trims: ["WT", "Custom", "LT", "RST", "LTZ", "High Country", "ZR2"] },
      { name: "Silverado 2500HD", aliases: ["silverado 2500", "2500hd", "2500 hd"], bodyStyle: "Pickup", trims: ["WT", "LT", "LTZ", "High Country"] },
      { name: "Colorado", aliases: ["colorado"], bodyStyle: "Pickup", trims: ["WT", "LT", "Z71", "Trail Boss", "ZR2"] },
      { name: "Tahoe", aliases: ["tahoe"], bodyStyle: "SUV", trims: ["LS", "LT", "RST", "Z71", "Premier", "High Country"] },
      { name: "Suburban", aliases: ["suburban"], bodyStyle: "SUV", trims: ["LS", "LT", "RST", "Premier", "High Country"] },
      { name: "Camaro", aliases: ["camaro"], bodyStyle: "Coupe", trims: ["LT", "SS", "ZL1"] },
      { name: "Corvette", aliases: ["corvette", "c8", "c7", "stingray"], bodyStyle: "Coupe", trims: ["Stingray", "Z06", "E-Ray"] },
      { name: "Equinox", aliases: ["equinox"], bodyStyle: "SUV", trims: ["LS", "LT", "RS", "Premier"] },
    ],
  },
  {
    name: "GMC",
    aliases: ["gmc"],
    models: [
      { name: "Sierra 1500", aliases: ["sierra 1500", "sierra"], bodyStyle: "Pickup", trims: ["Pro", "SLE", "Elevation", "SLT", "AT4", "Denali"] },
      { name: "Sierra 2500HD", aliases: ["sierra 2500", "2500hd"], bodyStyle: "Pickup", trims: ["Pro", "SLE", "SLT", "AT4", "Denali"] },
      { name: "Canyon", aliases: ["canyon"], bodyStyle: "Pickup", trims: ["Elevation", "AT4", "Denali"] },
      { name: "Yukon", aliases: ["yukon"], bodyStyle: "SUV", trims: ["SLE", "SLT", "AT4", "Denali"] },
      { name: "Acadia", aliases: ["acadia"], bodyStyle: "SUV", trims: ["SLE", "SLT", "AT4", "Denali"] },
    ],
  },
  {
    name: "Ram",
    aliases: ["ram", "dodge ram"],
    models: [
      { name: "1500", aliases: ["1500", "ram 1500"], bodyStyle: "Pickup", trims: ["Tradesman", "Big Horn", "Laramie", "Rebel", "Limited", "TRX"] },
      { name: "2500", aliases: ["2500", "ram 2500"], bodyStyle: "Pickup", trims: ["Tradesman", "Big Horn", "Laramie", "Limited", "Power Wagon"] },
      { name: "3500", aliases: ["3500", "ram 3500"], bodyStyle: "Pickup", trims: ["Tradesman", "Big Horn", "Laramie", "Limited"] },
    ],
  },
  {
    name: "Toyota",
    aliases: ["toyota"],
    models: [
      { name: "Tacoma", aliases: ["tacoma", "taco"], bodyStyle: "Pickup", trims: ["SR", "SR5", "TRD Sport", "TRD Off-Road", "Limited", "TRD Pro", "Trailhunter"] },
      { name: "Tundra", aliases: ["tundra"], bodyStyle: "Pickup", trims: ["SR", "SR5", "Limited", "Platinum", "1794", "TRD Pro", "Capstone"] },
      { name: "4Runner", aliases: ["4runner", "4 runner"], bodyStyle: "SUV", trims: ["SR5", "TRD Sport", "TRD Off-Road", "Limited", "TRD Pro"] },
      { name: "Camry", aliases: ["camry"], bodyStyle: "Sedan", trims: ["LE", "SE", "XLE", "XSE", "TRD"] },
      { name: "RAV4", aliases: ["rav4", "rav 4"], bodyStyle: "SUV", trims: ["LE", "XLE", "XLE Premium", "Adventure", "TRD Off-Road", "Limited", "Prime"] },
      { name: "Highlander", aliases: ["highlander"], bodyStyle: "SUV", trims: ["L", "LE", "XLE", "Limited", "Platinum"] },
      { name: "Land Cruiser", aliases: ["land cruiser", "landcruiser"], bodyStyle: "SUV", trims: ["1958", "Land Cruiser"] },
      { name: "Sequoia", aliases: ["sequoia"], bodyStyle: "SUV", trims: ["SR5", "Limited", "Platinum", "TRD Pro", "Capstone"] },
      { name: "Supra", aliases: ["supra"], bodyStyle: "Coupe", trims: ["2.0", "3.0", "3.0 Premium"] },
    ],
  },
  {
    name: "Jeep",
    aliases: ["jeep"],
    models: [
      { name: "Wrangler", aliases: ["wrangler"], bodyStyle: "SUV", trims: ["Sport", "Sport S", "Sahara", "Rubicon", "4xe", "Willys"] },
      { name: "Gladiator", aliases: ["gladiator"], bodyStyle: "Pickup", trims: ["Sport", "Overland", "Mojave", "Rubicon"] },
      { name: "Grand Cherokee", aliases: ["grand cherokee"], bodyStyle: "SUV", trims: ["Laredo", "Limited", "Trailhawk", "Overland", "Summit"] },
      { name: "Cherokee", aliases: ["cherokee"], bodyStyle: "SUV", trims: ["Latitude", "Limited", "Trailhawk"] },
      { name: "Compass", aliases: ["compass"], bodyStyle: "SUV", trims: ["Sport", "Latitude", "Limited", "Trailhawk"] },
    ],
  },
  {
    name: "Subaru",
    aliases: ["subaru"],
    models: [
      { name: "Outback", aliases: ["outback"], bodyStyle: "Wagon", trims: ["Base", "Premium", "Limited", "Onyx", "Wilderness", "Touring"] },
      { name: "Forester", aliases: ["forester"], bodyStyle: "SUV", trims: ["Base", "Premium", "Sport", "Limited", "Wilderness", "Touring"] },
      { name: "Crosstrek", aliases: ["crosstrek", "xv"], bodyStyle: "SUV", trims: ["Base", "Premium", "Sport", "Limited", "Wilderness"] },
      { name: "WRX", aliases: ["wrx", "sti"], bodyStyle: "Sedan", trims: ["Base", "Premium", "Limited", "GT", "STI"] },
      { name: "Ascent", aliases: ["ascent"], bodyStyle: "SUV", trims: ["Base", "Premium", "Onyx", "Limited", "Touring"] },
    ],
  },
  {
    name: "Honda",
    aliases: ["honda"],
    models: [
      { name: "Civic", aliases: ["civic"], bodyStyle: "Sedan", trims: ["LX", "Sport", "EX", "Touring", "Si", "Type R"] },
      { name: "Accord", aliases: ["accord"], bodyStyle: "Sedan", trims: ["LX", "Sport", "EX-L", "Touring"] },
      { name: "CR-V", aliases: ["cr-v", "crv"], bodyStyle: "SUV", trims: ["LX", "EX", "EX-L", "Sport", "Touring"] },
      { name: "Pilot", aliases: ["pilot"], bodyStyle: "SUV", trims: ["LX", "EX", "EX-L", "TrailSport", "Touring", "Elite"] },
      { name: "Ridgeline", aliases: ["ridgeline"], bodyStyle: "Pickup", trims: ["Sport", "RTL", "TrailSport", "Black Edition"] },
    ],
  },
  {
    name: "BMW",
    aliases: ["bmw"],
    models: [
      { name: "3 Series", aliases: ["3 series", "330i", "340i", "m340i", "328i", "335i"], bodyStyle: "Sedan", trims: ["330i", "330i xDrive", "M340i"] },
      { name: "5 Series", aliases: ["5 series", "530i", "540i", "m550i"], bodyStyle: "Sedan", trims: ["530i", "540i", "M550i"] },
      { name: "X3", aliases: ["x3"], bodyStyle: "SUV", trims: ["sDrive30i", "xDrive30i", "M40i", "X3 M"] },
      { name: "X5", aliases: ["x5"], bodyStyle: "SUV", trims: ["sDrive40i", "xDrive40i", "xDrive50e", "M60i", "X5 M"] },
      { name: "M3", aliases: ["m3"], bodyStyle: "Sedan", trims: ["Base", "Competition", "CS"] },
      { name: "M4", aliases: ["m4"], bodyStyle: "Coupe", trims: ["Base", "Competition", "CSL"] },
    ],
  },
  {
    name: "Porsche",
    aliases: ["porsche"],
    models: [
      { name: "911", aliases: ["911", "carrera", "gt3"], bodyStyle: "Coupe", trims: ["Carrera", "Carrera S", "Carrera 4S", "GTS", "Turbo", "Turbo S", "GT3", "GT3 RS"] },
      { name: "Cayenne", aliases: ["cayenne"], bodyStyle: "SUV", trims: ["Cayenne", "S", "E-Hybrid", "GTS", "Turbo"] },
      { name: "Macan", aliases: ["macan"], bodyStyle: "SUV", trims: ["Macan", "S", "GTS", "Turbo"] },
      { name: "Panamera", aliases: ["panamera"], bodyStyle: "Sedan", trims: ["Panamera", "4", "4S", "GTS", "Turbo"] },
      { name: "Boxster", aliases: ["boxster", "718 boxster"], bodyStyle: "Convertible", trims: ["Boxster", "S", "GTS", "Spyder"] },
      { name: "Cayman", aliases: ["cayman", "718 cayman"], bodyStyle: "Coupe", trims: ["Cayman", "S", "GTS", "GT4"] },
    ],
  },
];

export const MAKE_LOOKUP = new Map<string, VehicleMake>();
export const MODEL_LOOKUP: Array<{ make: VehicleMake; model: VehicleModel; alias: string }> = [];

for (const make of VEHICLE_CATALOG) {
  for (const alias of make.aliases) {
    MAKE_LOOKUP.set(alias.toLowerCase(), make);
  }
  MAKE_LOOKUP.set(make.name.toLowerCase(), make);
  for (const model of make.models) {
    for (const alias of [model.name, ...model.aliases]) {
      MODEL_LOOKUP.push({ make, model, alias: alias.toLowerCase() });
    }
  }
}

MODEL_LOOKUP.sort((a, b) => b.alias.length - a.alias.length);

export function findMake(text: string) {
  const lower = text.toLowerCase();
  for (const [alias, make] of MAKE_LOOKUP) {
    if (wordIncludes(lower, alias)) return make;
  }
  return null;
}

export function findModel(text: string, make?: VehicleMake | null) {
  const lower = text.toLowerCase();
  const candidates = make
    ? MODEL_LOOKUP.filter((entry) => entry.make.name === make.name)
    : MODEL_LOOKUP;
  for (const entry of candidates) {
    if (wordIncludes(lower, entry.alias)) return entry;
  }
  return null;
}

export function findTrim(text: string, model?: VehicleModel | null) {
  if (!model) return null;
  const lower = text.toLowerCase();
  const ranked = [...model.trims].sort((a, b) => b.length - a.length);
  for (const trim of ranked) {
    if (wordIncludes(lower, trim.toLowerCase())) return trim;
  }
  return null;
}

export function wordIncludes(haystack: string, needle: string) {
  if (!needle) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "[\\s-]*");
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return pattern.test(haystack);
}
