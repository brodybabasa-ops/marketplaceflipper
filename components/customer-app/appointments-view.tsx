import Link from "next/link";
import { Calendar, CalendarPlus, ChevronRight, Ellipsis, MapPin, Plus } from "lucide-react";
import {
  AppCard,
  AppPageHeader,
  FilterTabs,
  GhostCta,
  OutlineButton,
  SolidCta,
  StatusBadge,
} from "@/components/customer-app/primitives";
import { vehiclePhotoFor } from "@/lib/landing";

export type AppointmentRow = {
  id: string;
  href: string;
  calendarHref: string | null;
  vehicleLabel: string;
  problem: string;
  shopName: string;
  shopCity: string;
  distanceLabel?: string;
  photo: string;
  dateLine: string;
  timeLine: string;
  status: string;
  tone: "info" | "warning" | "success" | "muted";
  group: "upcoming" | "past" | "canceled";
};

export function CustomerAppointmentsView({
  rows,
  tab,
}: {
  rows: AppointmentRow[];
  tab: string;
}) {
  const counts = {
    upcoming: rows.filter((row) => row.group === "upcoming").length,
    past: rows.filter((row) => row.group === "past").length,
    canceled: rows.filter((row) => row.group === "canceled").length,
  };
  const active = tab || "upcoming";
  const visible = rows.filter((row) => row.group === active);
  const next = rows.find((row) => row.group === "upcoming");

  return (
    <div className="px-4 pt-2">
      <AppPageHeader
        title="My Appointments"
        subtitle="View, manage, and stay on top of your scheduled visits."
        action={
          <Link href="/request" className="inline-flex h-9 items-center gap-1 rounded-full bg-[#2f7bff] px-3 text-sm font-bold text-white">
            <Plus className="h-4 w-4" /> Book New
          </Link>
        }
      />
      <FilterTabs
        value={active}
        tabs={[
          { id: "upcoming", label: "Upcoming", count: counts.upcoming },
          { id: "past", label: "Past", count: counts.past },
          { id: "canceled", label: "Canceled", count: counts.canceled },
        ]}
      />

      {active === "upcoming" && next ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-bold text-white/50">Next Appointment</p>
          <AppCard className="p-3">
            <Link href={next.href} className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={next.photo} alt="" className="h-[92px] w-[108px] rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[15px] font-extrabold text-white">{next.vehicleLabel}</p>
                    <p className="text-xs text-white/55">{next.problem}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge label={next.status} tone={next.tone} />
                    <ChevronRight className="h-4 w-4 text-white/25" />
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
                  <Calendar className="h-3.5 w-3.5 text-[#2f7bff]" />
                  {next.dateLine}
                  {next.timeLine ? ` · ${next.timeLine}` : ""}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
                  <MapPin className="h-3.5 w-3.5 text-[#2f7bff]" />
                  {next.shopName}
                  {next.distanceLabel ? ` · ${next.distanceLabel}` : ""} · {next.shopCity}
                </p>
              </div>
            </Link>
            <div className="mt-3 flex gap-2">
              <OutlineButton href={`${next.href}#appointment`}>Reschedule</OutlineButton>
              {next.calendarHref ? <OutlineButton href={next.calendarHref}>Add to Calendar</OutlineButton> : null}
              <Link
                href={next.href}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/55"
                aria-label="More"
              >
                <Ellipsis className="h-4 w-4" />
              </Link>
            </div>
          </AppCard>
        </div>
      ) : null}

      <div className="mt-5 flex items-end justify-between">
        <h2 className="text-sm font-bold text-white/50">
          {active === "upcoming" ? "Upcoming Appointments" : active === "past" ? "Past Appointments" : "Canceled"}
        </h2>
        {active === "upcoming" ? (
          <Link href="/jobs" className="text-sm font-semibold text-[#7eb0ff]">
            See All →
          </Link>
        ) : null}
      </div>
      <div className="mt-2 space-y-2">
        {(active === "upcoming" ? visible.slice(1) : visible).map((row) => (
          <AppCard key={row.id} href={row.href} className="p-3">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.photo} alt="" className="h-16 w-20 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-white">{row.vehicleLabel}</p>
                    <p className="text-xs text-white/55">{row.problem}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge label={row.status} tone={row.tone} />
                    <ChevronRight className="h-4 w-4 text-white/25" />
                  </div>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
                  <Calendar className="h-3.5 w-3.5 text-[#2f7bff]" />
                  {row.dateLine}
                  {row.timeLine ? ` · ${row.timeLine}` : ""}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-white/40">
                  <MapPin className="h-3.5 w-3.5 text-[#2f7bff]" />
                  {row.shopName} · {row.shopCity}
                </p>
              </div>
            </div>
          </AppCard>
        ))}
        {visible.length === 0 ? <p className="text-sm text-white/45">Nothing in this list yet.</p> : null}
      </div>

      <div className="mt-4 space-y-3">
        <GhostCta href="/mechanics" icon={<CalendarPlus className="h-5 w-5" />} title="Book Another Appointment" body="Find a shop, check availability, and get on the schedule." />
        <SolidCta href="/how-it-works" icon={<CalendarPlus className="h-5 w-5" />} title="Appointment Tips" body="Need to reschedule? You can manage or reschedule most appointments directly in the app." />
      </div>
    </div>
  );
}

export function appointmentPhoto(make: string, model: string) {
  return vehiclePhotoFor(make, model);
}
