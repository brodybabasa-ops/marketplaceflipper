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
    showLocations: model === "MULTI_LOCATION" || model === "FLEET_SERVICE",
    primaryView: shop && !offsite ? "shop" : offsite && !shop ? "offsite" : "all",
    label:
      model === "SHOP_ONLY"
        ? "Customers bring assets to your location"
        : model === "MOBILE_ONLY"
          ? "You travel to customers / assets"
          : model === "FIELD_SERVICE"
            ? "Field service at job sites"
            : model === "MULTI_LOCATION"
              ? "Multiple service locations"
              : model === "FLEET_SERVICE"
                ? "Fleet maintenance operation"
                : "Shop and off-site work",
  };
}

export function operatingModelFromForm(shop: boolean, travel: boolean): OperatingModel {
  if (shop && travel) return "HYBRID";
  if (travel) return "MOBILE_ONLY";
  return "SHOP_ONLY";
}
