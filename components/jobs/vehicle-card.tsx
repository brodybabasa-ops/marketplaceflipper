import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatMiles } from "@/lib/utils";
import { vehiclePhotoFor } from "@/lib/landing";

type VehicleCardProps = {
  id: string;
  year: number;
  make: string;
  model: string;
  mileage: number;
  nickname?: string | null;
};

export function VehicleCard({ vehicle, ctaHref, ctaLabel = "Get Help" }: { vehicle: VehicleCardProps; ctaHref?: string; ctaLabel?: string }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={vehiclePhotoFor(vehicle.make, vehicle.model)} alt="" className="h-36 w-full object-cover" />
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{vehicle.nickname || "Vehicle"}</p>
        <h3 className="mt-1 text-xl font-semibold text-navy">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        <p className="mt-1 text-sm text-muted">{formatMiles(vehicle.mileage)}</p>
        {ctaHref ? (
          <Button asChild className="mt-4" size="sm">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
