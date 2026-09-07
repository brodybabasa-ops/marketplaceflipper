import Link from "next/link";
import { MechanicAppNav } from "@/components/layout/app-nav";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { addBlockedDateAction, saveAvailabilityAction } from "@/app/actions/phase2";
import { createScheduleBlockAction } from "@/app/actions/vision";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { jobAssetLabel } from "@/lib/asset-display";
import { getScheduleBoard, fillMyDay, smartFit } from "@/services/scheduler";
import { resolveOperatingModel, operatingViews } from "@/lib/operating-model";
import type { DayOfWeek } from "@prisma/client";

export const metadata = { title: "Schedule" };

const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default async function MechanicSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; fit?: string }>;
}) {
  const session = await requireSession("MECHANIC");
  const params = await searchParams;
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { availability: true, blockedDates: { orderBy: { date: "asc" } } },
  });
  const day = params.date ? new Date(params.date) : new Date();
  const board = await getScheduleBoard(profile.id, day);
  const fill = await fillMyDay(profile.id, day);
  const fit = params.fit ? await smartFit(profile.id, params.fit) : null;
  const views = operatingViews(resolveOperatingModel(profile));
  const byDay = Object.fromEntries(profile.availability.map((item) => [item.dayOfWeek, item]));
  const hours = Array.from({ length: 11 }, (_, i) => 7 + i);

  return (
    <div className="mx-auto max-w-6xl">
      <MechanicAppNav current="/mechanic/schedule" />
      <h1 className="text-3xl font-bold text-ink">How the operation is running</h1>
      <p className="mt-2 text-sm text-muted">
        {views.label}. Work blocks are not the same as the customer appointment. Pocket Mechanic will never silently auto-book a customer.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Badge>{board.onCalendar.length} on the board</Badge>
        <Badge tone="warning">{board.unscheduled.length} unscheduled</Badge>
        {views.showBays ? <Badge tone="muted">Bays / resources</Badge> : null}
        {views.showRoutes ? <Badge tone="muted">Off-site / travel</Badge> : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <Card className="overflow-x-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">{day.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h2>
              <Link className="text-sm text-accent" href={`/mechanic/schedule?date=${new Date(day.getTime() + 86400000).toISOString().slice(0, 10)}`}>
                Next day
              </Link>
            </div>
            {board.blocks.length === 0 && board.onCalendar.length === 0 ? (
              <EmptyState title="No work blocks today" body="Drag unscheduled jobs onto a time, or use Smart Fit. Appointments stay on the job until you confirm." />
            ) : (
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[4rem_1fr] text-xs text-muted">
                  <div />
                  <div className="flex gap-2">
                    {board.techs.map((tech) => (
                      <div key={tech.id} className="flex-1 font-semibold text-ink">
                        {"displayName" in tech ? tech.displayName : "Shop"}
                      </div>
                    ))}
                  </div>
                </div>
                {hours.map((hour) => (
                  <div key={hour} className="grid grid-cols-[4rem_1fr] border-t border-line py-2">
                    <p className="number text-xs text-muted">{hour}:00</p>
                    <div className="flex gap-2">
                      {board.techs.map((tech) => {
                        const slot = board.blocks.filter((block) => {
                          const startHour = block.startsAt.getHours();
                          return startHour === hour && (!block.technicianProfileId || block.technicianProfileId === tech.id || tech.id === "solo");
                        });
                        return (
                          <div key={tech.id} className="min-h-12 flex-1 space-y-1">
                            {slot.map((block) => (
                              <Link key={block.id} href={block.jobId ? `/mechanic/jobs/${block.jobId}` : "/mechanic/schedule"} className="block rounded-xl bg-accent/20 px-2 py-1 text-xs text-ink">
                                <span className="font-semibold">{block.title}</span>
                                {block.job ? <span className="block text-muted">{jobAssetLabel(block.job)}</span> : null}
                              </Link>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {board.onCalendar.map((job) => (
              <Link key={job.id} href={`/mechanic/jobs/${job.id}`} className="mt-3 block rounded-xl border border-line p-3 text-sm">
                Appointment · {job.scheduledAt?.toLocaleTimeString()} · {jobAssetLabel(job)} · {job.status.replaceAll("_", " ").toLowerCase()}
                {job.customerWaiting ? " · customer waiting" : ""}
                {job.partsStatus !== "UNKNOWN" ? ` · parts ${job.partsStatus.toLowerCase()}` : ""}
              </Link>
            ))}
          </Card>

          {views.showRoutes ? (
            <Card className="mt-4 p-5">
              <h2 className="font-semibold text-ink">Off-site / routes</h2>
              <p className="mt-2 text-sm text-muted">
                Travel blocks, arrival windows, and route order apply because this provider travels to assets. Pocket Mechanic will not rearrange confirmed appointments silently.
              </p>
            </Card>
          ) : (
            <Card className="mt-4 p-5">
              <h2 className="font-semibold text-ink">Shop board</h2>
              <p className="mt-2 text-sm text-muted">
                Route maps, ETAs, and travel-time blocks stay hidden for shop-only operations. Bays and drop-offs stay in view.
              </p>
              {views.showBays && board.resources.length ? (
                <ul className="mt-3 text-sm text-muted">
                  {board.resources.map((item) => (
                    <li key={item.id}>{item.name} · {item.kind.replaceAll("_", " ").toLowerCase()}</li>
                  ))}
                </ul>
              ) : null}
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold text-ink">Unscheduled</h2>
            {board.unscheduled.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Inbox is clear.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {board.unscheduled.map((job) => (
                  <li key={job.id} className="rounded-xl border border-line p-2">
                    <p className="font-semibold">{jobAssetLabel(job)}</p>
                    <p className="text-muted">{job.serviceRequest.problemText}</p>
                    <Link className="text-xs font-semibold text-accent" href={`/mechanic/schedule?fit=${job.id}`}>
                      Smart Fit
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-4">
            <h2 className="font-semibold text-ink">Fill my day</h2>
            <p className="mt-1 text-xs text-muted">Suggestions only. You choose. Customers are not booked automatically.</p>
            {fill.suggestions.map((item) => (
              <Link key={item.jobId} href={item.href} className="mt-2 block rounded-xl bg-slate p-2 text-sm">
                {item.title}
                <span className="block text-xs text-muted">{item.customer} · {item.asset}</span>
              </Link>
            ))}
          </Card>
          {fit ? (
            <Card className="p-4">
              <h2 className="font-semibold text-ink">Smart Fit</h2>
              <p className="mt-1 text-sm text-muted">{fit.job.serviceRequest.problemText}</p>
              {fit.candidates.map((item, index) => (
                <form key={item.startsAt.toISOString()} action={createScheduleBlockAction} className="mt-3 space-y-2 rounded-xl border border-line p-3">
                  <input type="hidden" name="jobId" value={fit.job.id} />
                  <input type="hidden" name="technicianProfileId" value={item.technicianId ?? ""} />
                  <input type="hidden" name="title" value={fit.job.serviceRequest.problemText.slice(0, 80)} />
                  <input type="hidden" name="startsAt" value={item.startsAt.toISOString()} />
                  <input type="hidden" name="endsAt" value={item.endsAt.toISOString()} />
                  <p className="text-sm font-semibold">{item.technicianName}</p>
                  <p className="text-xs text-muted">{item.startsAt.toLocaleString()} – {item.endsAt.toLocaleTimeString()}</p>
                  <p className="text-xs text-muted">{item.reasons.join(" · ")}</p>
                  <Button size="sm" type="submit">{index === 0 ? "Accept best fit" : "Use this slot"}</Button>
                </form>
              ))}
              {fit.candidates.length === 0 ? <p className="mt-2 text-sm text-muted">No open 2-hour block in the next week without a conflict.</p> : null}
            </Card>
          ) : null}
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
              <Button size="sm" type="submit">
                Add block
              </Button>
            </form>
          </Card>
        </aside>
      </div>

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
