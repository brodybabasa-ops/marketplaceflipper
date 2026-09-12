import Link from "next/link";
import { ArrowRight, Calendar, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
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
      <div className="relative z-10 mx-auto -mt-10 w-full max-w-[1180px] flex-1 px-4 pb-12 sm:px-6">
        <div className="rounded-[28px] bg-white p-4 shadow-[0_18px_40px_rgba(14,28,47,0.10)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              {TABS.map((item) => {
                const active = activeTab === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.key === "all" ? "/jobs" : `/jobs?tab=${item.key}`}
                    scroll={false}
                    className={cn(
                      "whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold sm:px-3.5 sm:text-sm",
                      active ? "bg-[#071422] text-white" : "text-[#6b7a8a] hover:text-navy",
                    )}
                  >
                    {item.label} ({counts[item.key]})
                  </Link>
                );
              })}
            </div>
            <label className="inline-flex shrink-0 items-center gap-2 text-sm text-[#6b7a8a]">
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

          <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,300px)]">
            <div className="min-w-0 space-y-3">
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
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#071422] pb-[4.5rem] pt-24">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/repairs-hero.png"
        alt=""
        className="absolute right-0 top-0 h-full w-[80%] object-cover object-[4%_54%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#071422_0%,rgba(7,20,34,0.88)_18%,rgba(7,20,34,0.42)_36%,rgba(7,20,34,0.12)_55%,rgba(7,20,34,0.02)_100%)]" />
      <p className="font-script pointer-events-none absolute right-8 top-[5.5rem] z-10 hidden max-w-[210px] rotate-[8deg] text-right text-[30px] leading-[1.08] text-white xl:block">
        Less Time
        <br />
        Waiting.
        <br />
        More Time
        <br />
        Out There.
      </p>
      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-white/80">MY REPAIRS</p>
        <h1 className="mt-2 max-w-xl text-4xl font-extrabold tracking-tight text-white sm:text-[44px] sm:leading-[1.05]">
          Track Your <span className="text-[#2f7bff]">Repairs.</span>
          <br />
          Stay in the <span className="text-[#2f7bff]">Loop.</span>
        </h1>
        <p className="mt-3 max-w-[34rem] text-[15px] leading-relaxed text-white/75">
          From drop-off to pick-up, see the status, details, and history of all your repairs in one place.
        </p>
      </div>
    </section>
  );
}

function RepairItem({ row }: { row: RepairRow }) {
  return (
    <article className="flex gap-4 rounded-2xl bg-[#f4f7fb] p-4">
      <div className="h-[72px] w-[88px] shrink-0 overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={row.photo} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="grid min-w-0 flex-1 gap-4 xl:grid-cols-[minmax(210px,1.05fr)_minmax(260px,1.2fr)_minmax(148px,auto)] xl:items-start">
        <div className="min-w-0">
          <p className="font-bold leading-tight">{row.vehicleLabel}</p>
          <p className="mt-0.5 text-sm text-[#6b7a8a]">{row.problem}</p>
          <div className="mt-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.shopPhoto} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-[#2f7bff]">{row.shopName}</p>
              <p className="text-xs text-[#6b7a8a]">{row.shopCity}</p>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", badgeClass(row.badge.tone))}>
            {row.badge.label}
          </span>
          <p className="mt-2 text-xs text-[#6b7a8a]">
            {row.dateLabel} {row.dateValue}
          </p>
          {row.relativeLabel ? <p className="text-xs text-[#6b7a8a]">{row.relativeLabel}</p> : null}
          <Stepper steps={row.steps} current={row.stepIndex} />
        </div>
        <div className="flex min-w-0 flex-col items-start xl:items-end">
          <p className="text-xs text-[#6b7a8a]">{row.priceLabel}</p>
          <p className="text-lg font-bold leading-tight">{row.price}</p>
          <div className="mt-3 flex w-full flex-col items-stretch gap-2 xl:w-[148px] xl:items-stretch">
            {row.actions.map((action) =>
              action.variant === "link" ? (
                <Link key={action.label} href={action.href} className="inline-flex items-center justify-end gap-1 text-sm font-semibold text-[#2f7bff]">
                  {action.label} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  key={action.label}
                  href={action.href}
                  className={cn(
                    "inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-sm font-semibold",
                    action.variant === "primary" ? "bg-[#2f7bff] text-white" : "border border-line bg-white text-navy",
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
  const last = steps.length - 1;
  const progress = current <= 0 ? 0 : (Math.min(current, last) / last) * 80;
  return (
    <div className="mt-3 w-full max-w-none">
      <div className="relative h-3">
        <span className="absolute left-[10%] right-[10%] top-1/2 h-[2px] -translate-y-1/2 bg-[#d5dee8]" />
        <span
          className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-[#2f7bff]"
          style={{ left: "10%", width: `${progress}%` }}
        />
        <ol className="relative grid h-full grid-cols-5">
          {steps.map((step, index) => {
            const done = index < current || current >= last;
            const active = index === current && current < last;
            return (
              <li key={step} className="flex items-center justify-center">
                <span
                  className={cn(
                    "rounded-full",
                    active
                      ? "h-3 w-3 bg-[#2f7bff] ring-4 ring-[#2f7bff]/20"
                      : done
                        ? "h-2.5 w-2.5 bg-[#2f7bff]"
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
          <li key={step} className="px-0.5 text-center text-[8px] leading-tight tracking-tight text-[#7a8794] whitespace-nowrap">
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
        <Link href="/appointments" className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#2f7bff]">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-3 flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={appointment.photo} alt="" className="h-14 w-16 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight">{appointment.vehicleLabel}</p>
          <p className="text-xs text-[#6b7a8a]">{appointment.shopName}</p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[#6b7a8a]">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[#2f7bff]" />
            {appointment.dateLabel}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-[#6b7a8a]">
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
          className="inline-flex h-9 items-center justify-center rounded-lg border border-line bg-white text-xs font-semibold"
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
        <Link href="/history" className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#2f7bff]">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dd className="text-2xl font-extrabold">{history.total}</dd>
          <dt className="text-[#6b7a8a]">Total Repairs</dt>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dd className="text-2xl font-extrabold">{history.completed}</dd>
          <dt className="text-[#6b7a8a]">Completed</dt>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dd className="text-2xl font-extrabold">{history.inProgress}</dd>
          <dt className="text-[#6b7a8a]">In Progress</dt>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
          <dd className="text-xl font-extrabold">{history.spentLabel}</dd>
          <dt className="max-w-[9rem] text-right text-xs text-[#6b7a8a]">Total Spent (Last 12 Months)</dt>
        </div>
      </dl>
    </section>
  );
}

function LifestyleCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/lifestyle.png" alt="" className="h-[210px] w-full object-cover object-[50%_70%]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,34,0.05)_0%,rgba(7,20,34,0.12)_55%,rgba(7,20,34,0.35)_100%)]" />
      <p className="font-script absolute right-3 top-5 max-w-[148px] rotate-[7deg] text-right text-[26px] leading-[1.05] text-white drop-shadow">
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
