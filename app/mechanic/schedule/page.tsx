import Link from "next/link";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { addBlockedDateAction, saveAvailabilityAction } from "@/app/actions/phase2";
import {
  createScheduleBlockAction,
  sendScheduleUpdateAction,
} from "@/app/actions/vision";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { jobAssetLabel } from "@/lib/asset-display";
import { getScheduleBoard, fillMyDay, smartFit, weekLoad, calloutRecovery, cancellationRecovery } from "@/services/scheduler";
import { parseNaturalScheduleCommand, scheduleMessageTemplate } from "@/lib/schedule-intelligence";
import { DayBoard, DraggableJob } from "@/components/schedule/day-board";
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
  const fill = await fillMyDay(profile.id, day);
  const fit = params.fit ? await smartFit(profile.id, params.fit) : null;
  const load = params.view === "load" ? await weekLoad(profile.id, day) : null;
  const callout = params.callout ? await calloutRecovery(profile.id, params.callout, day) : null;
  const recovery = params.recover ? await cancellationRecovery(profile.id, Number(params.recover) || 150) : null;
  const ask = params.ask ? parseNaturalScheduleCommand(params.ask) : null;
  const views = board.views;
  const byDay = Object.fromEntries(profile.availability.map((item) => [item.dayOfWeek, item]));
  const view = params.view ?? "day";
  const laneFilter = params.lane ?? (views.showHybridLanes ? "all" : views.primaryView);
  const lanes = board.techs.filter((tech) => {
    if (laneFilter === "shop") return tech.duty === "SHOP" || tech.duty === "BOTH";
    if (laneFilter === "offsite" || laneFilter === "routes") return tech.duty === "OFF_SITE" || tech.duty === "BOTH";
    return true;
  });
  const selected = params.block ? board.blocks.find((block) => block.id === params.block) : null;
  const nextDay = new Date(day.getTime() + 86400000).toISOString().slice(0, 10);
  const prevDay = new Date(day.getTime() - 86400000).toISOString().slice(0, 10);
  const nowHour = board.now.getHours();

  return (
    <div className="mx-auto max-w-7xl">
      <MechanicAppNav current="/mechanic/schedule" />
      <h1 className="text-3xl font-bold text-ink">How the operation is running</h1>
      <p className="mt-2 text-sm text-muted">
        {views.label}. Work blocks are not customer appointments. Pocket Mechanic never silently auto-books or rearranges confirmed work.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["day", ...(views.showHybridLanes ? ["shop", "offsite"] : []), ...(views.showRoutes && !views.showBays ? ["routes"] : []), "load", "huddle"] as string[])
          .filter((item, index, list) => list.indexOf(item) === index)
          .map((item) => (
            <Button key={item} asChild size="sm" variant={view === item || laneFilter === item ? "primary" : "secondary"}>
              <Link href={`/mechanic/schedule?date=${dateKey}&view=${item === "shop" || item === "offsite" || item === "routes" ? "day" : item}${item === "shop" || item === "offsite" || item === "routes" ? `&lane=${item}` : ""}`}>
                {item === "day" ? "Day" : item === "load" ? "Load" : item === "huddle" ? "Morning huddle" : item === "routes" ? "Routes" : item === "offsite" ? "Off-site" : "Shop"}
              </Link>
            </Button>
          ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted">On the board</p>
          <p className="number mt-1 text-2xl font-bold">{board.header.appointments}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">In progress / behind</p>
          <p className="number mt-1 text-2xl font-bold">
            {board.header.inProgress} / {board.header.behind}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Parts / approval</p>
          <p className="number mt-1 text-2xl font-bold">
            {board.header.waitingOnParts} / {board.header.awaitingApproval}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Open labor hours</p>
          <p className="number mt-1 text-2xl font-bold">{board.header.openHours}</p>
          <p className="mt-1 text-xs text-muted">{formatCents(board.header.expectedCents)} authorized on open jobs</p>
        </Card>
      </div>

      {board.attention.length ? (
        <div className="mt-4 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-warning">Needs attention</h2>
          {board.attention.slice(0, 6).map((item) => (
            <Link key={item.href + item.label} href={item.href} className="block rounded-xl border border-line bg-card px-3 py-2 text-sm">
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}

      {view === "load" && load ? (
        <Card className="mt-6 overflow-x-auto p-4">
          <h2 className="font-semibold text-ink">Technician load</h2>
          <p className="mt-1 text-sm text-muted">Utilization only. This is not a KPI dashboard.</p>
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
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Morning huddle</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>{board.header.appointments} appointments</li>
              <li>{board.unscheduled.length} unscheduled</li>
              <li>{board.jobs.filter((job) => job.customerWaiting).length} waiting customers</li>
              <li>{board.header.waitingOnParts} parts risks</li>
              <li>{board.header.awaitingApproval} estimates waiting</li>
              {views.showRoutes ? <li>Off-site travel is on — keep 20 min between stops.</li> : <li>Shop board — routes stay hidden.</li>}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Tomorrow prep</h2>
            <p className="mt-2 text-sm text-muted">
              Next day {nextDay}. Open the day board and clear parts, confirmations, and first jobs before close.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link href={`/mechanic/schedule?date=${nextDay}`}>Open tomorrow</Link>
            </Button>
          </Card>
        </div>
      ) : null}

      {view === "day" || view === "routes" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div>
            <Card className="overflow-x-auto p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-ink">{day.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h2>
                <div className="flex gap-3 text-sm">
                  <Link className="text-accent" href={`/mechanic/schedule?date=${prevDay}&view=${view}&lane=${laneFilter}`}>
                    Previous
                  </Link>
                  <Link className="text-accent" href={`/mechanic/schedule?date=${nextDay}&view=${view}&lane=${laneFilter}`}>
                    Next day
                  </Link>
                </div>
              </div>
              {board.blocks.length === 0 && board.onCalendar.length === 0 ? (
                <EmptyState title="No work blocks today" body="Drag unscheduled work onto a technician and time, or run Smart Fit. Appointments stay on the job until you confirm." />
              ) : (
                <DayBoard
                  date={dateKey}
                  hours={board.hours}
                  nowHour={nowHour}
                  showTravel={views.showTravel}
                  lanes={lanes.map((tech) => ({ id: tech.id, name: tech.displayName, duty: tech.duty }))}
                  cards={board.blocks.map((block) => ({
                    id: block.id,
                    title: block.title,
                    startsAt: block.startsAt.toISOString(),
                    endsAt: block.endsAt.toISOString(),
                    technicianProfileId: block.technicianProfileId,
                    jobId: block.jobId,
                    kind: block.kind,
                    assetLabel: block.assetLabel,
                    customerName: block.customerName,
                    waiting: block.waiting,
                    partsStatus: block.partsStatus,
                    authorization: block.authorization,
                    behind: block.behind,
                    inProgress: block.inProgress,
                    minutesBehind: block.minutesBehind,
                    durationMin: Math.max(30, (block.endsAt.getTime() - block.startsAt.getTime()) / 60000),
                  }))}
                />
              )}
              {views.showRoutes ? (
                <p className="mt-4 text-xs text-muted">
                  Off-site view: travel, arrival windows, and service locations apply. Pocket Mechanic will not rearrange confirmed appointments silently.
                </p>
              ) : (
                <p className="mt-4 text-xs text-muted">Shop board: route maps and technician ETAs stay hidden unless you enable off-site service.</p>
              )}
            </Card>

            {views.showBays && board.resources.length ? (
              <Card className="mt-4 p-4">
                <h2 className="font-semibold text-ink">Resources</h2>
                <ul className="mt-2 text-sm text-muted">
                  {board.resources.map((item) => (
                    <li key={item.id}>
                      {item.name} · {item.kind.replaceAll("_", " ").toLowerCase()}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {selected ? (
              <Card className="mt-4 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Work block</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">{selected.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  {selected.assetLabel} {selected.customerName ? `· ${selected.customerName}` : ""}
                </p>
                <p className="mt-2 text-sm">
                  Job {selected.job?.status.replaceAll("_", " ").toLowerCase() ?? "unlinked"} · schedule {selected.scheduleStatus.replaceAll("_", " ").toLowerCase()}
                </p>
                {selected.jobId ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={`/mechanic/jobs/${selected.jobId}`}>Open full job</Link>
                    </Button>
                    <form action={sendScheduleUpdateAction}>
                      <input type="hidden" name="jobId" value={selected.jobId} />
                      <input type="hidden" name="body" value={scheduleMessageTemplate(selected.behind ? "BEHIND" : "READY")} />
                      <Button size="sm" variant="secondary" type="submit">
                        {selected.behind ? "Send running-behind" : "Send ready update"}
                      </Button>
                    </form>
                    {views.showRoutes ? (
                      <form action={sendScheduleUpdateAction}>
                        <input type="hidden" name="jobId" value={selected.jobId} />
                        <input type="hidden" name="body" value={scheduleMessageTemplate("EN_ROUTE")} />
                        <Button size="sm" variant="secondary" type="submit">
                          Technician en route
                        </Button>
                      </form>
                    ) : (
                      <form action={sendScheduleUpdateAction}>
                        <input type="hidden" name="jobId" value={selected.jobId} />
                        <input type="hidden" name="body" value={scheduleMessageTemplate("READY")} />
                        <Button size="sm" variant="secondary" type="submit">
                          Ready for pickup
                        </Button>
                      </form>
                    )}
                  </div>
                ) : null}
              </Card>
            ) : null}
          </div>

          <aside className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold text-ink">Unscheduled</h2>
              {board.unscheduledQueue.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Inbox is clear.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {board.unscheduledQueue.map((item) => (
                    <li key={item.job.id}>
                      <DraggableJob jobId={item.job.id} title={jobAssetLabel(item.job)} durationMin={item.duration.scheduleMinutes} />
                      <p className="mt-1 px-1 text-[11px] text-muted">
                        {item.source} · {Math.round((item.duration.scheduleMinutes / 60) * 10) / 10} hr · {item.recommendedTech}
                      </p>
                      <Link className="px-1 text-xs font-semibold text-accent" href={item.fitHref}>
                        Smart Fit
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="p-4">
              <h2 className="font-semibold text-ink">Fill my day</h2>
              <p className="mt-1 text-xs text-muted">
                {fill.openHours} hours open. Suggestions only — you choose. Customers are not booked automatically.
              </p>
              {fill.suggestions.map((item) => (
                <Link key={item.jobId} href={item.href} className="mt-2 block rounded-xl bg-slate p-2 text-sm">
                  {item.title}
                  <span className="block text-xs text-muted">
                    {item.customer} · {item.asset} · {item.hours} hr · parts {item.parts.toLowerCase()}
                  </span>
                </Link>
              ))}
            </Card>
            {fit ? (
              <Card className="p-4">
                <h2 className="font-semibold text-ink">Smart Fit</h2>
                <p className="mt-1 text-sm text-muted">{fit.job.serviceRequest.problemText}</p>
                <p className="mt-1 text-xs text-muted">
                  Labor {fit.duration.laborMinutes} min · schedule {fit.duration.scheduleMinutes} min · {fit.duration.factors.join(" · ")}
                </p>
                {fit.candidates.map((item, index) => (
                  <form key={item.startsAt.toISOString()} action={createScheduleBlockAction} className="mt-3 space-y-2 rounded-xl border border-line p-3">
                    <input type="hidden" name="jobId" value={fit.job.id} />
                    <input type="hidden" name="technicianProfileId" value={item.technicianId ?? ""} />
                    <input type="hidden" name="title" value={fit.job.serviceRequest.problemText.slice(0, 80)} />
                    <input type="hidden" name="startsAt" value={item.startsAt.toISOString()} />
                    <input type="hidden" name="endsAt" value={item.endsAt.toISOString()} />
                    {item.warnings.length ? <input type="hidden" name="overrideReason" value={item.warnings.join(" ")} /> : null}
                    <p className="text-sm font-semibold">{index === 0 ? "Best fit · " : ""}{item.technicianName}</p>
                    <p className="text-xs text-muted">
                      {item.startsAt.toLocaleString()} – {item.endsAt.toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-muted">{item.reasons.join(" · ")}</p>
                    {item.warnings.length ? <p className="text-xs text-warning">{item.warnings.join(" ")}</p> : null}
                    <Button size="sm" type="submit">
                      {index === 0 ? "Accept best fit" : "Use this slot"}
                    </Button>
                  </form>
                ))}
                {fit.candidates.length === 0 ? <p className="mt-2 text-sm text-muted">No open block this week without a hard conflict.</p> : null}
              </Card>
            ) : null}
            <Card className="p-4">
              <h2 className="font-semibold text-ink">Ask the dispatcher</h2>
              <p className="mt-1 text-xs text-muted">Suggests only. Never commits.</p>
              <form className="mt-2 space-y-2">
                <input type="hidden" name="date" value={dateKey} />
                <Input name="ask" defaultValue={params.ask ?? ""} placeholder="Schedule Sarah’s F-150 brakes with Tyler Thursday afternoon" />
                <Button size="sm" type="submit" variant="secondary">
                  Suggest
                </Button>
              </form>
              {ask ? <p className="mt-2 text-xs text-muted">{ask.summary}</p> : null}
            </Card>
            {board.techs.length > 1 ? (
              <Card className="p-4">
                <h2 className="font-semibold text-ink">Tech call-out</h2>
                <p className="mt-1 text-xs text-muted">Proposes a recovery plan. You confirm every move.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {board.techs.filter((tech) => tech.id !== "solo").map((tech) => (
                    <Button key={tech.id} asChild size="sm" variant="secondary">
                      <Link href={`/mechanic/schedule?date=${dateKey}&callout=${tech.id}`}>{tech.displayName} called out</Link>
                    </Button>
                  ))}
                </div>
                {callout ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="text-muted">{callout.affectedCount} jobs affected · {callout.notifyCount} customers may need a message</li>
                    {callout.plan.map((item) => (
                      <li key={item.block.id}>
                        <Link className="text-accent" href={item.href}>
                          {item.block.title}
                        </Link>
                        <span className="text-muted"> · {item.suggestion}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ) : null}
            <Card className="p-4">
              <h2 className="font-semibold text-ink">Cancellation recovery</h2>
              <Button asChild size="sm" variant="secondary">
                <Link href={`/mechanic/schedule?date=${dateKey}&recover=150`}>2.5 hours just opened</Link>
              </Button>
              {recovery ? (
                <ul className="mt-3 space-y-1 text-xs text-muted">
                  {recovery.fits.slice(0, 4).map((item) => (
                    <li key={item.job.id}>
                      {jobAssetLabel(item.job)} · {item.source}
                    </li>
                  ))}
                  {recovery.recommended.slice(0, 3).map((item) => (
                    <li key={item.href}>
                      {item.title} · {item.customer}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
            <Card className="p-4">
              <h2 className="font-semibold text-ink">Place a work block</h2>
              <form action={createScheduleBlockAction} className="mt-3 space-y-2">
                <Field label="Title">
                  <Input name="title" required placeholder="Diagnosis / brakes / QC" />
                </Field>
                <Field label="Start">
                  <Input name="startsAt" type="datetime-local" required />
                </Field>
                <Field label="End">
                  <Input name="endsAt" type="datetime-local" required />
                </Field>
                {board.jobs.length ? (
                  <Field label="Job (optional)">
                    <Select name="jobId" defaultValue="">
                      <option value="">None</option>
                      {board.jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {jobAssetLabel(job)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                {views.showBays && board.resources.length ? (
                  <Field label="Resource">
                    <Select name="resourceId" defaultValue="">
                      <option value="">None</option>
                      {board.resources.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                <Select name="kind" defaultValue="WORK">
                  <option value="WORK">Work</option>
                  {views.showDropOff ? <option value="DROP_OFF">Drop-off</option> : null}
                  {views.showPickup ? <option value="PICKUP">Pickup</option> : null}
                  {views.showTravel ? <option value="TRAVEL">Travel</option> : null}
                  <option value="QC">QC</option>
                  {views.showRoutes ? <option value="WATER_TEST">Water test</option> : <option value="ROAD_TEST">Road test</option>}
                  <option value="BUFFER">Buffer</option>
                  <option value="BREAK">Break</option>
                </Select>
                <Button size="sm" type="submit">
                  Add block
                </Button>
              </form>
            </Card>
          </aside>
        </div>
      ) : null}

      <Card className="mt-8 p-5">
        <h2 className="font-semibold text-ink">Weekly hours</h2>
        <p className="mt-1 text-sm text-muted">Customer-facing availability. Work blocks can still be placed inside these hours.</p>
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
          <Button type="submit" className="mt-3">
            Save hours
          </Button>
        </form>
      </Card>
      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">Block a date</h2>
        <form action={addBlockedDateAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input name="date" type="date" required />
          <Input name="reason" placeholder="Vacation, shop closed..." />
          <Button type="submit" variant="secondary">
            Block
          </Button>
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
