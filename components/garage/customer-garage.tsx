import Link from "next/link";
import {
  AlertTriangle,
  Bike,
  Camera,
  Car,
  Caravan,
  ChevronRight,
  CircleCheck,
  Container,
  Ellipsis,
  FileText,
  Gauge,
  LineChart,
  MoreVertical,
  PenLine,
  Plus,
  Sailboat,
  Shield,
  Tag,
  Tractor,
  Truck,
  Wrench,
} from "lucide-react";
import { CopyIdentifier, InsightsPeriod } from "@/components/garage/garage-controls";
import type { GarageInsights, GarageMaintenance, GarageVehicle } from "@/services/customer-garage";
import { cn } from "@/lib/utils";

const SUPPORT = [
  { label: "Cars", icon: Car },
  { label: "Trucks", icon: Truck },
  { label: "Motorcycles", icon: Bike },
  { label: "ATVs/UTVs", icon: Tractor },
  { label: "Boats", icon: Sailboat },
  { label: "RVs", icon: Caravan },
  { label: "Trailers", icon: Container },
  { label: "Powersports", icon: Gauge },
  { label: "And More", icon: Ellipsis },
];

const ACTIONS = [
  { href: "/vehicles/import", icon: FileText, title: "Import Vehicle", body: "Add by VIN or HIN" },
  { href: "/vehicles/new", icon: PenLine, title: "Manual Entry", body: "Add a vehicle manually" },
  { href: "/vehicles/import", icon: Camera, title: "Scan Document", body: "Type the VIN from the document" },
];

export function CustomerGarage({
  vehicles,
  maintenance,
  insights,
}: {
  vehicles: GarageVehicle[];
  maintenance: GarageMaintenance[];
  insights: GarageInsights;
}) {
  return (
    <div className="relative min-h-full bg-[#071422] pb-8 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/hero-truck.png" alt="" className="h-full w-full object-cover object-[80%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.82)_0%,rgba(7,20,34,0.42)_34%,rgba(7,20,34,0.06)_68%),linear-gradient(180deg,rgba(7,20,34,0.18)_0%,rgba(7,20,34,0)_32%,rgba(7,20,34,0.88)_100%)]" />
      </div>

      <div className="relative pt-4">
        <div className="px-5 lg:px-6">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[#2f7bff]">MY GARAGE</p>
        <h1 className="mt-1.5 max-w-xl text-[38px] font-extrabold leading-[1.05] tracking-tight sm:text-[42px]">
          All Your Vehicles.
          <br />
          All in One Place.
        </h1>
        <p className="mt-2.5 max-w-md text-sm leading-relaxed text-white/70">
          Track maintenance, view repair history, and never miss a service again.
        </p>
        </div>
        <p className="font-script pointer-events-none absolute right-10 top-6 hidden max-w-[210px] rotate-[8deg] text-right text-[32px] leading-[1.05] text-white/95 xl:block">
          Good Vehicles
          <br />
          Lead to
          <br />
          Great Adventures.
        </p>

        <div className="mt-6 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {vehicles.map((vehicle) => (
            <VehicleTile key={vehicle.id ?? `${vehicle.make}-${vehicle.model}`} vehicle={vehicle} />
          ))}
        </div>

        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/vehicles/new"
            className="flex min-h-[132px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2f7bff]/45 px-4 text-center"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2f7bff] text-white">
              <Plus className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-bold text-[#2f7bff]">Add Another Vehicle</span>
            <span className="mt-1 max-w-[220px] text-xs leading-snug text-white/50">
              Cars, trucks, boats, RVs, motorcycles, ATVs and more.
            </span>
          </Link>
          {ACTIONS.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="relative flex min-h-[132px] flex-col rounded-2xl bg-[#0d1f33] px-5 py-4"
            >
              <action.icon className="h-5 w-5 text-white/85" />
              <span className="mt-3 text-sm font-bold">{action.title}</span>
              <span className="mt-1 text-xs text-white/50">{action.body}</span>
              <ChevronRight className="absolute bottom-5 right-5 h-4 w-4 text-[#2f7bff]" />
            </Link>
          ))}
        </div>

        <div className="mt-3.5 grid gap-3.5 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
          <section className="rounded-2xl bg-[#0d1f33] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Upcoming Maintenance</h2>
              <Link href="/appointments" className="text-sm font-semibold text-[#2f7bff]">
                View All
              </Link>
            </div>
            <div className="space-y-2.5">
              {maintenance.map((item) => (
                <article key={`${item.vehicleLabel}-${item.service}`} className="flex items-center gap-3 rounded-xl bg-[#0a1829] px-3 py-2">
                  <Link href={item.href} className="flex min-w-0 flex-1 items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.photo} alt="" className="h-12 w-[72px] rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.vehicleLabel}</p>
                      <p className="text-xs text-white/50">{item.service}</p>
                    </div>
                  </Link>
                  <div className="text-right">
                    <p className={cn("text-sm font-bold", item.dueTone === "urgent" ? "text-[#e8783a]" : "text-white")}>{item.due}</p>
                    <p className="text-[11px] text-white/40">{item.date}</p>
                  </div>
                  <button type="button" className="text-white/30 hover:text-white" aria-label={`${item.vehicleLabel} options`}>
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-[#0d1f33] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Garage Insights</h2>
              <InsightsPeriod />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Insight icon={Wrench} value={String(insights.vehicles)} label="Vehicles" />
              <Insight icon={Tag} value={String(insights.servicesCompleted)} label="Services Completed" />
              <Insight icon={LineChart} value={insights.totalMaintenance} label="Total Maintenance" />
              <Insight icon={Shield} value={String(insights.openRecalls)} label="Open Recalls" />
            </div>
            <p className="mt-4 text-center text-sm italic text-white/55">“Well maintained vehicles take you further.”</p>
          </section>
        </div>

        <section className="mt-3.5 rounded-2xl bg-[#0d1f33] px-5 py-4">
          <h2 className="text-lg font-bold">We Support All Types of Vehicles</h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 text-xs font-medium text-white/70">
            {SUPPORT.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2">
                <item.icon className="h-4 w-4 text-white/80" />
                {item.label}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function VehicleTile({ vehicle }: { vehicle: GarageVehicle }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-[#0d1f33]">
      <Link href={vehicle.href} className="block">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vehicle.photo} alt="" className={cn("h-[128px] w-full object-cover", vehicle.photoClass)} />
          {vehicle.primary ? (
            <span className="absolute right-3 top-3 rounded-full bg-[#2f7bff] px-2.5 py-0.5 text-[11px] font-semibold">Primary</span>
          ) : null}
        </div>
        <div className="px-4 pb-2 pt-3">
          <h3 className="text-[15px] font-bold leading-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.trim ? <p className="mt-0.5 text-xs text-white/55">{vehicle.trim}</p> : null}
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/45">
            <span>
              {vehicle.identifierLabel}: {vehicle.identifier}
            </span>
            {vehicle.copyable ? <CopyIdentifier value={vehicle.identifier} label={vehicle.identifierLabel} /> : null}
          </p>
          <p className="mt-1 text-sm text-white/80">{vehicle.usage}</p>
          <div className="mt-3 flex items-center justify-between">
            {vehicle.status === "ok" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1f8a5b] px-2 py-0.5 text-[11px] font-semibold text-white">
                <CircleCheck className="h-3 w-3" />
                {vehicle.statusLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8b923] px-2 py-0.5 text-[11px] font-semibold text-[#1a1408]">
                <AlertTriangle className="h-3 w-3" />
                {vehicle.statusLabel}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-[#2f7bff]" />
          </div>
        </div>
      </Link>
      {vehicle.editHref ? (
        <div className="px-4 pb-3">
          <Link href={vehicle.editHref} className="text-[12px] font-semibold text-[#7eb0ff]">
            Edit vehicle
          </Link>
        </div>
      ) : null}
    </article>
  );
}

function Insight({ icon: Icon, value, label }: { icon: typeof Wrench; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-[#0a1829] px-4 py-4">
      <div className="flex items-start gap-2">
        <Icon className="mt-1 h-4 w-4 text-[#2f7bff]" />
        <div>
          <p className="text-2xl font-extrabold leading-none">{value}</p>
          <p className="mt-1 text-xs text-white/50">{label}</p>
        </div>
      </div>
    </div>
  );
}
