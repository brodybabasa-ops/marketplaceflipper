import type { OperatingModel, ServiceMode } from "@prisma/client";

export function resolveOperatingModel(input: {
  operatingModel?: OperatingModel | null;
  serviceMode: ServiceMode;
}): OperatingModel {
  if (input.operatingModel) return input.operatingModel;
  if (input.serviceMode === "MOBILE") return "MOBILE_ONLY";
  if (input.serviceMode === "SHOP") return "SHOP_ONLY";
  return "HYBRID";
}

export function operatingViews(model: OperatingModel) {
  const offsite = model === "MOBILE_ONLY" || model === "HYBRID" || model === "FIELD_SERVICE";
  const shop = model === "SHOP_ONLY" || model === "HYBRID" || model === "MULTI_LOCATION" || model === "FLEET_SERVICE";
  return {
    model,
    showBays: shop,
    showRoutes: offsite,
    showTravel: offsite,
    showDropOff: shop,
    showServiceArea: offsite,
    showMap: offsite,
    showOptimizeRoute: offsite,
    showArrivalWindow: offsite,
    showPickup: shop,
    showLocations: model === "MULTI_LOCATION" || model === "FLEET_SERVICE",
    showFieldSites: model === "FIELD_SERVICE" || model === "HYBRID" || model === "FLEET_SERVICE",
    showHybridLanes: model === "HYBRID",
    primaryView: shop && !offsite ? "shop" : offsite && !shop ? "offsite" : "all",
    boardViews: shop && !offsite ? (["day", "load", "huddle"] as const) : offsite && !shop ? (["day", "routes", "load"] as const) : (["day", "shop", "offsite", "load", "huddle"] as const),
    label:
      model === "SHOP_ONLY"
        ? "Customers bring assets to your location"
        : model === "MOBILE_ONLY"
          ? "You travel to customers / assets"
          : model === "FIELD_SERVICE"
            ? "Field service at job sites, yards, marinas, and facilities"
            : model === "MULTI_LOCATION"
              ? "Multiple service locations"
              : model === "FLEET_SERVICE"
                ? "Fleet maintenance operation"
                : "Shop and off-site work",
  };
}

export function operatingModelFromForm(
  shop: boolean,
  travel: boolean,
  extra?: { multi?: boolean; fleet?: boolean; field?: boolean },
): OperatingModel {
  if (extra?.fleet) return "FLEET_SERVICE";
  if (extra?.multi && shop) return "MULTI_LOCATION";
  if (extra?.field && travel && !shop) return "FIELD_SERVICE";
  if (shop && travel) return "HYBRID";
  if (travel) return "MOBILE_ONLY";
  return "SHOP_ONLY";
}

export function resourceKindsForModel(model: OperatingModel) {
  if (model === "MOBILE_ONLY") return ["SERVICE_TRUCK", "FIELD_UNIT", "OTHER"] as const;
  if (model === "FIELD_SERVICE") return ["SERVICE_TRUCK", "FIELD_UNIT", "YARD", "WASH", "OTHER"] as const;
  if (model === "FLEET_SERVICE") return ["BAY", "SERVICE_TRUCK", "FIELD_UNIT", "YARD", "WASH", "OTHER"] as const;
  if (model === "SHOP_ONLY") return ["BAY", "LIFT", "ALIGNMENT_RACK", "DIAGNOSTIC_STATION", "BENCH", "MOTORCYCLE_LIFT", "DYNO", "WASH", "OTHER"] as const;
  if (model === "MULTI_LOCATION") return ["BAY", "LIFT", "ALIGNMENT_RACK", "DIAGNOSTIC_STATION", "YARD", "WASH", "OTHER"] as const;
  return ["BAY", "LIFT", "ALIGNMENT_RACK", "DIAGNOSTIC_STATION", "BENCH", "MOTORCYCLE_LIFT", "YARD", "WATER_TEST", "LAUNCH", "DYNO", "WASH", "SERVICE_TRUCK", "FIELD_UNIT", "OTHER"] as const;
}
