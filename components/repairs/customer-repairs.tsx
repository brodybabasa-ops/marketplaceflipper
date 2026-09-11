import Link from "next/link";
import { ArrowRight, Calendar, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { KeepRunningBar } from "@/components/layout/keep-running-bar";
import type {
  RepairHistorySummary,
  RepairRow,
  RepairTab,
  UpcomingAppointment,
} from "@/services/customer-repairs";

const TABS: { key: RepairTab; label: string }[] = [
  { key: "all", label: "All Repairs" },
  { key: "in-progress", label: "In Progress" },
  { key: "waiting-parts", label: "Waiting on Parts" },
  { key: "waiting-approval", label: "Waiting on Approval" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export function CustomerRepairs({
  rows,
  counts,
  appointment,
  history,
  activeTab = "all",
}: {
  rows: RepairRow[];
  counts: Record<RepairTab, number>;
  appointment: UpcomingAppointment | null;
  history: RepairHistorySummary;
  activeTab?: RepairTab;
}) {
  const visible = activeTab === "all" ? rows : rows.filter((row) => row.tab === activeTab);

  return (
    <div className="flex min-h-full flex-col bg-[#e8eef4] text-navy">
      <Hero />
      <div className="relative z-10 mx-auto -mt-8 w-full max-w-[1180px] flex-1 px-4 pb-12 sm:px-6">
        <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-[0_18px_40px_rgba(14,28,47,0.10)] sm:p-6">
          <div className="flex flex-col gap-3 border-b border-line pb-1 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-wrap gap-x-1">
              {TABS.map((item) => {
                const active = activeTab === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.key === "all" ? "/jobs" : `/jobs?tab=${item.key}`}
                    scroll={false}
                    className={cn(
                      "-mb-px whitespace-nowrap border-b-2 px-2 py-2.5 text-[13px] font-semibold sm:px-3 sm:text-sm",
                      active ? "border-[#2f7bff] text-[#2f7bff]" : "border-transparent text-muted hover:text-navy",
                    )}
                  >
                    {item.label} ({counts[item.key]})
                  </Link>
                );
              })}
            </div>
            <label className="mb-2 inline-flex shrink-0 items-center gap-2 text-sm text-muted">
              Sort by:
              <span className="relative">
                <select
                  defaultValue="newest"
                  className="appearance-none rounded-lg border border-line bg-white py-1.5 pl-3 pr-8 text-sm font-semibold text-navy outline-none"
                >
                  <option value="newest">Newest First</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              </span>
            </label>
          </div>

          <div className="mt-5 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 divide-y divide-line">
              {visible.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">No repairs in this list.</p>
              ) : (
                visible.map((row) => <RepairItem key={row.id} row={row} />)
              )}
            </div>
            <aside className="min-w-0 space-y-4">
              {appointment ? <UpcomingCard appointment={appointment} /> : null}
              <HistoryCard history={history} />
              <LifestyleCard />
            </aside>
          </div>
        </div>
      </div>
      <KeepRunningBar />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#071422] pb-16 pt-24">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/repairs-hero.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[78%_center]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.94)_0%,rgba(7,20,34,0.78)_36%,rgba(7,20,34,0.28)_68%,rgba(7,20,34,0.12)_100%)]" />
      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.22em] text-white/75">MY REPAIRS</p>
        <h1 className="mt-2 max-w-xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Track Your <span className="text-[#2f7bff]">Repairs.</span>
          <br />
          Stay in the <span className="text-[#2f7bff]">Loop.</span>
        </h1>
        <p className="mt-3 max-w-md text-white/75">
          From drop-off to pick-up, see the status, details, and history of all your repairs in one place.
        </p>
        <p className="font-script mt-4 text-2xl text-white/90">Less Time Waiting. More Time Out There.</p>
      </div>
    </section>
  );
}

function RepairItem({ row }: { row: RepairRow }) {
  return (
    <article className="flex min-w-0 gap-4 py-5">
      <div className="h-[76px] w-[92px] shrink-0 overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={row.photo} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold leading-tight">{row.vehicleLabel}</p>
            <p className="text-sm text-muted">{row.problem}</p>
          </div>
          <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", badgeClass(row.badge.tone))}>
            {row.badge.label}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={row.shopPhoto} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-[#2f7bff]">{row.shopName}</p>
            <p className="text-xs text-muted">{row.shopCity}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          {row.dateLabel} {row.dateValue}
          {row.relativeLabel ? ` · ${row.relativeLabel}` : ""}
        </p>
        <Stepper steps={row.steps} current={row.stepIndex} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">{row.priceLabel}</p>
            <p className="text-lg font-bold">{row.price}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {row.actions.map((action) =>
              action.variant === "link" ? (
                <Link key={action.label} href={action.href} className="inline-flex items-center gap-1 text-sm font-semibold text-[#2f7bff]">
                  {action.label} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  key={action.label}
                  href={action.href}
                  className={cn(
                    "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold",
                    action.variant === "primary" ? "bg-[#2f7bff] text-white" : "border border-line text-navy",
                  )}
                >
                  {action.label}
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const progress = current <= 0 ? 0 : (current / (steps.length - 1)) * 80;
  return (
    <div className="mt-3 w-full max-w-md">
      <div className="relative h-3">
        <span className="absolute left-[10%] right-[10%] top-1/2 h-[2px] -translate-y-1/2 bg-[#d5dee8]" />
        <span
          className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-[#2f7bff]"
          style={{ left: "10%", width: `${progress}%` }}
        />
        <ol className="relative grid h-full grid-cols-5">
          {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li key={step} className="flex items-center justify-center">
                <span
                  className={cn(
                    "rounded-full",
                    active
                      ? "h-3 w-3 bg-[#2f7bff] ring-4 ring-[#2f7bff]/20"
                      : done
                        ? "h-2 w-2 bg-[#2f7bff]"
                        : "h-2 w-2 border border-[#c5d0dc] bg-white",
                  )}
                />
              </li>
            );
          })}
        </ol>
      </div>
      <ol className="mt-1.5 grid grid-cols-5">
        {steps.map((step) => (
          <li key={step} className="px-0.5 text-center text-[9px] leading-tight text-[#7a8794]">
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

function UpcomingCard({ appointment }: { appointment: UpcomingAppointment }) {
  return (
    <section className="rounded-2xl border border-line p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold">
          <Calendar className="h-4 w-4 shrink-0 text-[#2f7bff]" />
          Upcoming Appointment
        </h2>
        <Link href="/appointments" className="shrink-0 text-sm font-semibold text-[#2f7bff]">
          View All →
        </Link>
      </div>
      <div className="mt-3 flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={appointment.photo} alt="" className="h-14 w-16 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight">{appointment.vehicleLabel}</p>
          <p className="text-xs text-muted">{appointment.shopName}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[#2f7bff]" />
            {appointment.dateLabel}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[#2f7bff]" />
            {appointment.timeLabel}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={appointment.calendarHref}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-[#071422] px-2 text-center text-xs font-semibold text-white"
        >
          Add to Calendar
        </Link>
        <Link
          href={appointment.detailsHref}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-line text-xs font-semibold"
        >
          Reschedule
        </Link>
      </div>
    </section>
  );
}

function HistoryCard({ history }: { history: RepairHistorySummary }) {
  return (
    <section className="rounded-2xl border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">Repair History</h2>
        <Link href="/history" className="shrink-0 text-sm font-semibold text-[#2f7bff]">
          View All →
        </Link>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dd className="text-2xl font-extrabold">{history.total}</dd>
          <dt className="text-muted">Total Repairs</dt>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dd className="text-2xl font-extrabold">{history.completed}</dd>
          <dt className="text-muted">Completed</dt>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dd className="text-2xl font-extrabold">{history.inProgress}</dd>
          <dt className="text-muted">In Progress</dt>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
          <dd className="text-xl font-extrabold">{history.spentLabel}</dd>
          <dt className="max-w-[9rem] text-right text-xs text-muted">Total Spent (Last 12 Months)</dt>
        </div>
      </dl>
    </section>
  );
}

function LifestyleCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/repairs-lifestyle.png" alt="" className="h-48 w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071422]/70 via-[#071422]/10 to-transparent" />
      <p className="font-script absolute bottom-3 left-3 right-3 text-2xl leading-tight text-white drop-shadow">
        Machines Get You Places. We Keep Them Going.
      </p>
    </section>
  );
}

function badgeClass(tone: RepairRow["badge"]["tone"]) {
  if (tone === "warning") return "bg-[#fff4de] text-[#c98412]";
  if (tone === "success") return "bg-emerald-50 text-[#1f8a5b]";
  if (tone === "info") return "bg-[#e8f1ff] text-[#2f7bff]";
  return "bg-paper text-muted";
}
