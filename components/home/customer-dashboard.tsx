import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  HelpCircle,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { DirectoryMap } from "@/components/mechanics/directory-map";
import type {
  DashboardActivity,
  DashboardMessage,
  DashboardRepair,
  DashboardVehicle,
} from "@/services/customer-dashboard";
import type { DirectoryShop } from "@/services/landing";
import { StoreBadges } from "@/components/marketing/marketing-shell";
import { cn } from "@/lib/utils";

const STEPS = ["Received", "Diagnosing", "Parts Ordered", "In Service", "Complete"];

export function CustomerDashboard({
  firstName,
  vehicles,
  repairs,
  shops,
  origin,
  activity,
  messages,
}: {
  firstName: string;
  vehicles: DashboardVehicle[];
  repairs: DashboardRepair[];
  shops: DirectoryShop[];
  origin: { latitude: number; longitude: number; city: string } | null;
  activity: DashboardActivity[];
  messages: DashboardMessage[];
}) {
  return (
    <div className="flex min-h-full flex-col bg-[#e8eef4] text-navy">
      <Hero firstName={firstName} />
      <div className="relative z-10 -mt-8 w-full flex-1 bg-white">
        <QuickActions />
        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <ActiveRepairs repairs={repairs} />
          <div className="min-w-0 space-y-4">
            <MyVehicles vehicles={vehicles} />
            <NearbyShops shops={shops} origin={origin} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_280px]">
          <RecentActivity items={activity} />
          <MessagesCard items={messages} />
          <AppCta />
        </div>
      </div>
      <footer className="relative mt-auto overflow-hidden bg-[#071422]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/lifestyle.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-[#071422]/55" />
        <div className="relative flex w-full items-center justify-between px-4 py-8 lg:px-6">
          <p className="text-sm font-semibold tracking-[0.18em] text-white">POCKET MECHANIC</p>
          <p className="font-script text-2xl text-white">Keep It Running.</p>
        </div>
      </footer>
    </div>
  );
}

function Hero({ firstName }: { firstName: string }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-24">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/dashboard-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[78%_center]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.92)_0%,rgba(7,20,34,0.62)_42%,rgba(7,20,34,0.18)_100%)]" />
      <div className="relative w-full px-5 lg:px-6">
        <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Welcome back,
          <br />
          <span className="text-[#2f7bff]">{firstName}.</span>
        </h1>
        <p className="mt-3 max-w-lg text-white/75">Keep your machines running so you can get back out there.</p>
        <p className="font-script mt-4 text-2xl text-white/90">Good Machines Lead to Great Days.</p>
      </div>
    </section>
  );
}

function QuickActions() {
  const items = [
    { href: "/mechanics", icon: Search, title: "Find a Shop", body: "Get your next repair done" },
    { href: "/request", icon: ClipboardList, title: "Get an Estimate", body: "Compare shop quotes" },
    { href: "/appointments", icon: Calendar, title: "Book an Appointment", body: "Schedule your service" },
    { href: "/messages", icon: HelpCircle, title: "Ask a Question", body: "Get help from your shops" },
  ];
  return (
    <div className="grid gap-2 bg-white p-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link key={item.title} href={item.href} className="flex items-center gap-3 rounded-2xl bg-[#f7f9fc] px-3 py-3 hover:bg-[#eef3f9]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#2f7bff]">
            <item.icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold">{item.title}</span>
            <span className="block text-xs text-muted">{item.body}</span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 text-[#2f7bff]" />
        </Link>
      ))}
    </div>
  );
}

function ActiveRepairs({ repairs }: { repairs: DashboardRepair[] }) {
  return (
    <section className="h-fit bg-white p-5">
      <Header title="Active Repairs" href="/jobs" />
      {repairs.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No active repairs. Request a shop when something needs fixed.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {repairs.map((repair) => (
            <article key={repair.id} className="grid min-w-0 gap-4 border-b border-line pb-4 last:border-0 last:pb-0 md:grid-cols-[88px_minmax(0,1fr)_auto]">
              <div className="relative h-20 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={repair.photo} alt="" className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{repair.vehicleLabel}</p>
                    <p className="text-sm text-muted">{repair.problem}</p>
                    <p className="mt-1 text-sm font-semibold text-[#2f7bff]">{repair.shopName}</p>
                    {repair.shopCity ? <p className="text-xs text-muted">{repair.shopCity}</p> : null}
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", badgeClass(repair.badge.tone))}>
                    {repair.badge.label}
                  </span>
                </div>
                {repair.showStepper ? (
                  <div className="mt-3">
                    <ol className="flex items-center gap-2">
                      {STEPS.map((step, index) => (
                        <li key={step} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[10px] text-muted">
                          <span className={cn("h-1.5 w-full rounded-full", index <= repair.stepIndex ? "bg-[#2f7bff]" : "bg-line")} />
                          {step}
                        </li>
                      ))}
                    </ol>
                    <p className="mt-2 text-xs text-muted">Last update {repair.updatedLabel}</p>
                  </div>
                ) : null}
                {repair.estimateLabel ? <p className="mt-2 text-sm font-semibold">{repair.estimateLabel}</p> : null}
                {repair.appointmentLabel ? (
                  <p className="mt-2 text-sm text-muted">
                    Date & Time <span className="font-semibold text-navy">{repair.appointmentLabel}</span>
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col justify-center gap-2">
                {repair.actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={cn(
                      "inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-semibold",
                      action.variant === "primary" ? "bg-[#2f7bff] text-white" : "border border-line",
                    )}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MyVehicles({ vehicles }: { vehicles: DashboardVehicle[] }) {
  return (
    <section className="bg-white p-5">
      <Header title="My Vehicles" href="/vehicles" action="Manage" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {vehicles.map((vehicle) => (
          <Link key={vehicle.id} href={`/request?vehicle=${vehicle.id}`} className="overflow-hidden rounded-2xl bg-[#f4f7fb]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={vehicle.photo} alt="" className="h-20 w-full object-cover" />
            <span className="block px-2 py-2">
              <span className="block truncate text-sm font-bold leading-tight">{vehicle.label}</span>
              <span className="text-xs text-muted">{vehicle.year}</span>
            </span>
          </Link>
        ))}
        <Link href="/vehicles/new" className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-[#f4f7fb] text-sm font-semibold text-[#2f7bff]">
          <Plus className="mb-1 h-5 w-5" />
          Add Vehicle
        </Link>
      </div>
    </section>
  );
}

function NearbyShops({
  shops,
  origin,
}: {
  shops: DirectoryShop[];
  origin: { latitude: number; longitude: number; city: string } | null;
}) {
  return (
    <section className="bg-white p-5">
      <Header title="Nearby Shops" href="/mechanics" />
      <div className="mt-3 space-y-3">
        <DirectoryMap shops={shops} origin={origin} compact hideCities={origin?.city !== "Layton"} />
        <div className="space-y-2">
          {shops.map((shop) => (
            <Link key={shop.slug} href={`/mechanics/${shop.slug}`} className="flex gap-3 rounded-2xl bg-[#f4f7fb] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shop.photo} alt="" className="h-14 w-16 rounded-xl object-cover" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{shop.businessName}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {shop.averageRating.toFixed(1)}
                  <span>({shop.reviewCount})</span>
                </span>
                <span className="text-xs text-muted">
                  {shop.distanceLabel} · {shop.city}, {shop.state}
                </span>
              </span>
            </Link>
          ))}
          <Link href="/mechanics" className="block text-center text-sm font-semibold text-[#2f7bff]">
            Search Shops Near Me
          </Link>
        </div>
      </div>
    </section>
  );
}

function RecentActivity({ items }: { items: DashboardActivity[] }) {
  return (
    <section className="bg-white p-5">
      <Header title="Recent Activity" href="/jobs" />
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Activity from jobs, estimates, and messages will show up here.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="block text-xs text-muted">{item.detail}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{item.when}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MessagesCard({ items }: { items: DashboardMessage[] }) {
  return (
    <section className="bg-white p-5">
      <Header title="Messages" href="/messages" />
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No conversations yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.shopName}</span>
                  <span className="block truncate text-xs text-muted">{item.preview}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{item.when}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AppCta() {
  return (
    <section className="overflow-hidden bg-[#071422] text-white">
      <div className="relative h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/app-phone.png" alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071422] via-[#071422]/20 to-transparent" />
      </div>
      <div className="p-5">
        <p className="font-script text-2xl leading-tight">
          Less Time
          <br />
          Dealing With Repairs.
          <br />
          More Time Out Here.
        </p>
        <p className="mt-2 text-xs text-white/55">Create an account to use Pocket Mechanic on any phone.</p>
        <StoreBadges className="mt-4" />
      </div>
    </section>
  );
}

function Header({ title, href, action = "View All" }: { title: string; href: string; action?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-[#2f7bff]">
        {action} →
      </Link>
    </div>
  );
}

function badgeClass(tone: DashboardRepair["badge"]["tone"]) {
  if (tone === "warning") return "bg-amber-50 text-warning";
  if (tone === "success") return "bg-emerald-50 text-success";
  if (tone === "info") return "bg-[#e8f1ff] text-[#2f7bff]";
  return "bg-paper text-muted";
}
