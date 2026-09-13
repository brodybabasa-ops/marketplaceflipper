export function isMarineVehicle(make: string, model: string) {
  const hay = `${make} ${model}`.toLowerCase();
  return hay.includes("centurion") || hay.includes("yamaha") || hay.includes("boat") || hay.includes("fx cruiser");
}
