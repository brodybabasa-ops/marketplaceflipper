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
import { cn } from "@/lib/utils";

const STEPS = ["Received", "Diagnosing", "In Service", "Complete"];

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
    <div className="bg-[#e8eef4] text-navy">
      <Hero firstName={firstName} />
      <div className="relative z-10 mx-auto -mt-8 max-w-[1180px] px-6 pb-10">
        <QuickActions />
        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <ActiveRepairs repairs={repairs} />
          <div className="space-y-4">
            <MyVehicles vehicles={vehicles} />
            <NearbyShops shops={shops} origin={origin} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_280px]">
          <RecentActivity items={activity} />
          <MessagesCard items={messages} />
          <AppCta />
        </div>
      </div>
      <footer className="relative overflow-hidden bg-[#071422]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/lifestyle.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-[#071422]/55" />
        <div className="relative mx-auto flex max-w-[1180px] items-center justify-between px-6 py-8">
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
      <img src="/landing/hero-truck.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[72%_center]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.92)_0%,rgba(7,20,34,0.55)_48%,rgba(7,20,34,0.18)_100%)]" />
      <p className="font-script absolute right-[6%] top-24 hidden max-w-[160px] text-right text-2xl leading-tight text-white/90 lg:block">
        Good Machines
        <br />
        Lead to
        <br />
        Great Days.
      </p>
      <div className="relative mx-auto max-w-[1180px] px-6">
        <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Welcome back,
          <br />
          <span className="text-[#2f7bff]">{firstName}.</span>
        </h1>
        <p className="mt-3 max-w-lg text-white/75">Keep your machines running so you can get back out there.</p>
      </div>
    </section>
  );
}

function QuickActions() {
  const items = [
    { href: "/mechanics", icon: Search, title: "Find a Shop", body: "Get your next repair done" },
    { href: "/request", icon: ClipboardList, title: "Get an Estimate", body: "Compare shop quotes" },
    { href: "/request", icon: Calendar, title: "Book an Appointment", body: "Schedule your service" },
    { href: "/messages", icon: HelpCircle, title: "Ask a Question", body: "Get help from your shops" },
  ];
  return (
    <div className="grid gap-2 rounded-[24px] bg-white p-2 shadow-[0_18px_40px_rgba(14,28,47,0.08)] sm:grid-cols-2 xl:grid-cols-4">
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
    <section className="h-fit rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
      <Header title="Active Repairs" href="/jobs" />
      {repairs.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No active repairs. Request a shop when something needs fixed.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {repairs.map((repair) => (
            <article key={repair.id} className="grid gap-4 border-b border-line pb-4 last:border-0 last:pb-0 md:grid-cols-[88px_minmax(0,1fr)_auto]">
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
                {repair.estimateLabel ? (
                  <Link href={`/jobs/${repair.id}`} className="inline-flex h-9 items-center justify-center rounded-xl bg-[#2f7bff] px-3 text-sm font-semibold text-white">
                    View Estimate
                  </Link>
                ) : null}
                <Link href={`/jobs/${repair.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-line px-3 text-sm font-semibold">
                  {repair.appointmentLabel ? "View Details" : "Message Shop"}
                </Link>
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
    <section className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
      <Header title="My Vehicles" href="/vehicles" action="Manage" />
      <div className="mt-4 grid grid-cols-3 gap-3">
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
    <section className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
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
    <section className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
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
    <section className="rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
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
    <section className="relative overflow-hidden rounded-[24px] min-h-[220px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/lifestyle.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[#071422]/70" />
      <div className="relative flex h-full flex-col justify-end p-5 text-white">
        <p className="font-script text-2xl leading-tight">
          Less Time
          <br />
          Dealing With Repairs.
          <br />
          More Time Out Here.
        </p>
        <Link href="/sign-up" className="mt-4 inline-flex h-10 w-fit items-center rounded-xl bg-[#2f7bff] px-4 text-sm font-semibold">
          Get the App
        </Link>
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
