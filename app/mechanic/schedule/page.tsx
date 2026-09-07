import Link from "next/link";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addBlockedDateAction, saveAvailabilityAction } from "@/app/actions/phase2";
import { createScheduleBlockFormAction } from "@/app/actions/vision";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { jobAssetLabel } from "@/lib/asset-display";
import { getScheduleBoard, fillFromBoard, smartFit, weekLoad, calloutRecovery, cancellationRecovery } from "@/services/scheduler";
import { parseNaturalScheduleCommand } from "@/lib/schedule-intelligence";
import { CommandBoard } from "@/components/schedule/command-board";
import { displayTitle } from "@/lib/schedule-visual";
import type { DayOfWeek } from "@prisma/client";

export const metadata = { title: "Schedule" };

const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default async function MechanicSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; fit?: string; view?: string; lane?: string; block?: string; ask?: string; recover?: string; callout?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const params = await searchParams;
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { availability: true, blockedDates: { orderBy: { date: "asc" } } },
  });
  const day = params.date ? new Date(`${params.date}T12:00:00`) : new Date();
  const dateKey = day.toISOString().slice(0, 10);
  const board = await getScheduleBoard(profile.id, day);
  const fill = fillFromBoard(board);
  const fit = params.fit ? await smartFit(profile.id, params.fit) : null;
  const view = params.view ?? "day";
  const load = view === "week" || view === "load" ? await weekLoad(profile.id, day) : null;
  const callout = params.callout ? await calloutRecovery(profile.id, params.callout, day) : null;
  const recovery = params.recover ? await cancellationRecovery(profile.id, Number(params.recover) || 150) : null;
  const ask = params.ask ? parseNaturalScheduleCommand(params.ask) : null;
  const views = board.views;
  const byDay = Object.fromEntries(profile.availability.map((item) => [item.dayOfWeek, item]));
  const tabs = ["day", "week", "month", "list", ...(views.showRoutes && !views.showBays ? ["routes"] : []), "load", "huddle"] as const;

  return (
    <div className="mx-auto max-w-[96rem]">
      <MechanicAppNav current="/mechanic/schedule" />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button key={item} asChild size="sm" variant={view === item ? "primary" : "secondary"}>
            <Link href={`/mechanic/schedule?date=${dateKey}&view=${item}`}>
              {item === "day" ? "Day" : item === "week" ? "Week" : item === "month" ? "Month" : item === "list" ? "List" : item === "load" ? "Load" : item === "huddle" ? "Morning huddle" : "Routes"}
            </Link>
          </Button>
        ))}
      </div>

      {view === "day" || view === "routes" ? (
        <CommandBoard
          date={dateKey}
          shopStart={board.hours[0] ?? 8}
          shopEnd={(board.hours.at(-1) ?? 17) + 1}
          showBays={views.showBays}
          showTravel={views.showTravel}
          header={board.header}
          attention={board.attention}
          techs={board.techRows}
          resources={board.resources.map((item) => ({ id: item.id, name: item.name, kind: item.kind }))}
          cards={board.blocks.map((block) => ({
            id: block.id,
            title: block.title,
            startsAt: block.startsAt.toISOString(),
            endsAt: block.endsAt.toISOString(),
            technicianProfileId: block.technicianProfileId,
            resourceId: block.resourceId,
            jobId: block.jobId,
            kind: block.kind,
            assetLabel: block.assetLabel,
            customerName: block.customerName,
            waiting: block.waiting,
            partsStatus: block.partsStatus,
            authorization: block.authorization,
            authorizedCents: block.authorizedCents,
            behind: block.behind,
            inProgress: block.inProgress,
            minutesBehind: block.minutesBehind,
            durationMin: block.durationMin,
            jobStatus: block.jobStatus,
            category: block.category,
            requestKind: block.requestKind,
            urgencyMode: block.urgencyMode,
            complaint: block.complaint,
            technicianName: block.technicianName,
            resourceName: block.resourceName,
            progressPct: block.progressPct,
            progressLabel: block.progressLabel,
            checkIn: block.checkIn,
            source: block.source,
            potentiallyDelayed: block.potentiallyDelayed,
            slip: block.slip,
            promiseAtRisk: block.promiseAtRisk,
          }))}
          unscheduled={board.unscheduledQueue.map((item) => ({
            jobId: item.job.id,
            title: item.job.serviceRequest.problemText,
            asset: jobAssetLabel(item.job),
            customer: `${item.job.customer.firstName} ${item.job.customer.lastName}`,
            source: item.source,
            hours: Math.round((item.duration.scheduleMinutes / 60) * 10) / 10,
            parts: item.job.partsStatus,
            recommendedTech: item.recommendedTech,
            fitHref: item.fitHref,
          }))}
          arrivals={board.arrivals}
          upcoming={board.upcoming}
          monthDays={board.monthDays}
          fillOpenHours={fill.openHours}
          jobs={board.jobs.map((job) => ({ id: job.id, label: jobAssetLabel(job) }))}
        />
      ) : null}

      {view === "week" && load ? (
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Week capacity</h2>
          <p className="mt-1 text-sm text-muted">Heatmap of technician load. Over 100% is over capacity — do not treat this as a KPI dashboard.</p>
          <table className="mt-4 w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2">Tech</th>
                {load.days.map((label) => (
                  <th key={label} className="pb-2">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {load.rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 font-semibold">{row.name}</td>
                  {row.cells.map((cell, index) => (
                    <td key={index}>
                      <span className={`inline-block min-w-12 rounded-lg px-2 py-1 text-center ${cell.overload ? "bg-danger/20 text-danger" : cell.pct > 80 ? "bg-warning/20 text-warning" : cell.underused ? "bg-slate text-muted" : "bg-success/15 text-success"}`}>
                        {cell.pct}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {view === "month" ? (
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Month density</h2>
          <p className="mt-1 text-sm text-muted">Appointment load by day. Over 100% is over capacity — not a KPI dashboard.</p>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] text-muted">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <span key={label}>{label}</span>
            ))}
            {(() => {
              const first = board.monthDays[0]?.date;
              if (!first) return null;
              const pad = (new Date(`${first}T12:00:00`).getDay() + 6) % 7;
              return [
                ...Array.from({ length: pad }, (_, index) => <span key={`pad-${index}`} />),
                ...board.monthDays.map((day) => (
                  <Link
                    key={day.date}
                    href={`/mechanic/schedule?date=${day.date}`}
                    className={`rounded-2xl border border-line p-3 ${day.pct > 100 ? "bg-danger/15 text-danger" : day.pct > 80 ? "bg-warning/10" : day.pct === 0 ? "bg-navy/40 text-muted" : "bg-card text-ink"}`}
                  >
                    <span className="block text-xs">{Number(day.date.slice(-2))}</span>
                    <span className="number mt-1 block text-lg font-bold">{day.pct}%</span>
                  </Link>
                )),
              ];
            })()}
          </div>
        </Card>
      ) : null}

      {view === "list" ? (
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Chronological list</h2>
          <ul className="mt-4 space-y-2">
            {board.blocks.map((block) => (
              <li key={block.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${block.behind ? "border-danger/40 bg-danger/10" : "border-line"}`}>
                <span>
                  <span className="number text-muted">{block.startsAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> {displayTitle(block.title)}
                  <span className="block text-xs text-muted">
                    {block.assetLabel} · {block.technicianName ?? "Unassigned"} · {block.progressLabel}
                    {block.behind ? ` · running late +${block.minutesBehind} min` : ""}
                  </span>
                </span>
                {block.jobId ? (
                  <Link className="text-accent" href={`/mechanic/jobs/${block.jobId}`}>
                    Open job
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {view === "load" && load ? (
        <Card className="overflow-x-auto p-4">
          <h2 className="font-semibold text-ink">Technician load</h2>
          <table className="mt-4 w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2">Tech</th>
                {load.days.map((label) => (
                  <th key={label} className="pb-2">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {load.rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 font-semibold">{row.name}</td>
                  {row.cells.map((cell, index) => (
                    <td key={index} className={cell.overload ? "text-danger" : cell.underused ? "text-muted" : "text-ink"}>
                      {cell.pct}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {view === "huddle" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Morning huddle</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>{board.header.appointments} appointments · {board.header.utilization}% utilized</li>
              <li>{board.unscheduled.length} unscheduled</li>
              <li>{board.header.waitingCustomers} waiting customers</li>
              <li>{board.header.waitingOnParts} parts risks</li>
              <li>{board.header.awaitingApproval} estimates waiting</li>
              {views.showRoutes ? <li>Off-site travel is on — keep travel between stops.</li> : <li>Shop board — routes stay hidden.</li>}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Tomorrow prep</h2>
            <Button asChild className="mt-4" size="sm">
              <Link href={`/mechanic/schedule?date=${new Date(day.getTime() + 86400000).toISOString().slice(0, 10)}`}>Open tomorrow</Link>
            </Button>
          </Card>
        </div>
      ) : null}

      {fit ? (
        <Card className="mt-6 p-4">
          <h2 className="font-semibold text-ink">Smart Fit</h2>
          <p className="mt-1 text-sm text-muted">{fit.job.serviceRequest.problemText}</p>
          {fit.candidates.map((item, index) => (
            <form key={item.startsAt.toISOString()} action={createScheduleBlockFormAction} className="mt-3 space-y-2 rounded-xl border border-line p-3">
              <input type="hidden" name="jobId" value={fit.job.id} />
              <input type="hidden" name="technicianProfileId" value={item.technicianId ?? ""} />
              <input type="hidden" name="title" value={fit.job.serviceRequest.problemText.slice(0, 80)} />
              <input type="hidden" name="startsAt" value={item.startsAt.toISOString()} />
              <input type="hidden" name="endsAt" value={item.endsAt.toISOString()} />
              {item.warnings.length ? <input type="hidden" name="overrideReason" value={item.warnings.join(" ")} /> : null}
              <p className="text-sm font-semibold">{index === 0 ? "Best available · " : ""}{item.technicianName}</p>
              <p className="text-xs text-muted">{item.startsAt.toLocaleString()} – {item.endsAt.toLocaleTimeString()}</p>
              <p className="text-xs text-muted">{item.reasons.join(" · ")}</p>
              <Button size="sm" type="submit">{index === 0 ? "Accept best fit" : "Use this slot"}</Button>
            </form>
          ))}
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-semibold text-ink">Ask the dispatcher</h2>
          <p className="mt-1 text-xs text-muted">Suggests only. Never commits. Shortcut N = new, T = today.</p>
          <form className="mt-2 space-y-2">
            <input type="hidden" name="date" value={dateKey} />
            <Input name="ask" defaultValue={params.ask ?? ""} placeholder="Schedule Sarah’s F-150 brakes with Tyler Thursday afternoon" />
            <Button size="sm" type="submit" variant="secondary">Suggest</Button>
          </form>
          {ask ? <p className="mt-2 text-xs text-muted">{ask.summary}</p> : null}
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold text-ink">Recovery</h2>
          {board.techs.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {board.techs.filter((tech) => tech.id !== "solo").map((tech) => (
                <Button key={tech.id} asChild size="sm" variant="secondary">
                  <Link href={`/mechanic/schedule?date=${dateKey}&callout=${tech.id}`}>{tech.displayName} called out</Link>
                </Button>
              ))}
            </div>
          ) : null}
          <Button asChild size="sm" variant="secondary" className="mt-2">
            <Link href={`/mechanic/schedule?date=${dateKey}&recover=150`}>2.5 hours just opened</Link>
          </Button>
          {callout ? <p className="mt-2 text-xs text-muted">{callout.affectedCount} jobs affected · {callout.notifyCount} may need a message</p> : null}
          {recovery ? <p className="mt-2 text-xs text-muted">{recovery.fits.length} jobs could fill the opening.</p> : null}
        </Card>
      </div>

      <Card className="mt-8 p-5">
        <h2 className="font-semibold text-ink">Shop hours</h2>
        <form action={saveAvailabilityAction} className="mt-4 space-y-2">
          {DAYS.map((d) => {
            const current = byDay[d];
            return (
              <div key={d} className="grid grid-cols-[7rem_auto_1fr_1fr] items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name={`enabled_${d}`} defaultChecked={Boolean(current)} />
                  {d.slice(0, 3)}
                </label>
                <span className="text-muted">hours</span>
                <Input name={`start_${d}`} type="time" defaultValue={current?.startTime ?? "08:00"} />
                <Input name={`end_${d}`} type="time" defaultValue={current?.endTime ?? "18:00"} />
              </div>
            );
          })}
          <Button type="submit" className="mt-3">Save hours</Button>
        </form>
      </Card>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">Block a date</h2>
        <form action={addBlockedDateAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input name="date" type="date" required />
          <Input name="reason" placeholder="Vacation, shop closed..." />
          <Button type="submit" variant="secondary">Block</Button>
        </form>
        <ul className="mt-4 space-y-1 text-sm text-muted">
          {profile.blockedDates.map((item) => (
            <li key={item.id}>
              {item.date.toISOString().slice(0, 10)}
              {item.reason ? ` · ${item.reason}` : ""}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
