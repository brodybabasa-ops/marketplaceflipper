import Link from "next/link";
import { Calendar, Clock, Ellipsis, Plus, Wrench } from "lucide-react";
import {
  AppCard,
  AppPageHeader,
  FilterTabs,
  GhostCta,
  OutlineButton,
  PrimaryButton,
  SolidCta,
  StatusBadge,
} from "@/components/customer-app/primitives";
import type { GarageVehicle } from "@/services/customer-garage";

export function CustomerGarageView({
  vehicles,
  counts,
  kind,
}: {
  vehicles: GarageVehicle[];
  counts: Record<"all" | "auto" | "marine" | "powersports" | "rv", number>;
  kind: string;
}) {
  const active = kind || "all";
  const visible = active === "all" ? vehicles : vehicles.filter((vehicle) => vehicle.kind === active);
  return (
    <div className="px-4 pt-2">
      <AppPageHeader
        title="My Garage"
        subtitle="Everything you own. Keep it running."
        action={
          <Link
            href="/vehicles/new"
            className="inline-flex h-9 items-center gap-1 rounded-full bg-[#2f7bff] px-3 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Add Vehicle
          </Link>
        }
      />
      <FilterTabs
        param="kind"
        value={active}
        tabs={[
          { id: "all", label: "All", count: counts.all },
          { id: "auto", label: "Auto", count: counts.auto },
          { id: "marine", label: "Marine", count: counts.marine },
          { id: "powersports", label: "Powersports", count: counts.powersports },
          { id: "rv", label: "RV", count: counts.rv },
        ]}
      />
      <div className="mt-4 space-y-3">
        {visible.map((vehicle) => (
          <AppCard key={vehicle.id} className="p-3">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vehicle.photo} alt="" className="h-[92px] w-[108px] shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-extrabold text-white">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-xs text-white/45">{vehicle.subtitle}</p>
                  </div>
                  <Link href={vehicle.editHref} className="text-white/40" aria-label="Vehicle options">
                    <Ellipsis className="h-5 w-5" />
                  </Link>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {vehicle.badges.map((badge) => (
                    <StatusBadge key={badge.label} label={badge.label} tone={badge.tone} />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2f7bff]" />
                <div>
                  <p className="text-white/40">{vehicle.lastServiceLabel}</p>
                  <p className="font-semibold text-white">{vehicle.lastServiceValue}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2f7bff]" />
                <div>
                  <p className="text-white/40">{vehicle.nextServiceLabel}</p>
                  <p className="font-semibold text-white">{vehicle.nextServiceValue}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <OutlineButton href={vehicle.href}>View Details</OutlineButton>
              <PrimaryButton href={vehicle.requestHref}>Request Service</PrimaryButton>
            </div>
          </AppCard>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        <GhostCta href="/vehicles/new" icon={<Plus className="h-5 w-5" />} title="Add Another Vehicle" body="Cars, boats, bikes, RVs, and more." />
        <SolidCta
          href="/request"
          icon={<Wrench className="h-5 w-5" />}
          title="Not sure what service you need?"
          body="Get personalized maintenance recommendations based on your vehicles and usage."
        />
      </div>
    </div>
  );
}
