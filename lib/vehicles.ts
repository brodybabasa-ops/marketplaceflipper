export type VehicleKind = "auto" | "marine" | "powersports" | "rv";

export function isMarineVehicle(make: string, model: string) {
  const hay = `${make} ${model}`.toLowerCase();
  return (
    hay.includes("centurion") ||
    hay.includes("yamaha") ||
    hay.includes("boat") ||
    hay.includes("fx cruiser") ||
    hay.includes("sea-doo") ||
    hay.includes("jet ski") ||
    hay.includes("pwc")
  );
}

export function usesHours(make: string, model: string) {
  const hay = `${make} ${model}`.toLowerCase();
  return (
    isMarineVehicle(make, model) ||
    hay.includes("ktm") ||
    hay.includes("dirt") ||
    hay.includes("motorcycle") ||
    hay.includes("sx-f") ||
    hay.includes("xc-f")
  );
}

export function vehicleKind(make: string, model: string): VehicleKind {
  const hay = `${make} ${model}`.toLowerCase();
  if (isMarineVehicle(make, model)) return "marine";
  if (
    hay.includes("winnebago") ||
    hay.includes("minnie") ||
    hay.includes("rv") ||
    hay.includes("camper") ||
    hay.includes("gfc") ||
    hay.includes("motorhome")
  ) {
    return "rv";
  }
  if (
    hay.includes("ktm") ||
    hay.includes("sx-f") ||
    hay.includes("xc-f") ||
    hay.includes("dirt") ||
    hay.includes("motorcycle") ||
    hay.includes("atv") ||
    hay.includes("utv") ||
    hay.includes("powersport")
  ) {
    return "powersports";
  }
  return "auto";
}

export function vehicleKindLabel(kind: VehicleKind) {
  if (kind === "marine") return "Marine";
  if (kind === "powersports") return "Powersports";
  if (kind === "rv") return "RV";
  return "Auto";
}

export function historyKindLabel(kind: VehicleKind) {
  if (kind === "marine") return "Boat";
  if (kind === "powersports") return "Dirt Bike";
  if (kind === "rv") return "Camper";
  return "Truck";
}
