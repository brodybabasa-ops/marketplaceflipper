import { AppNav, MECHANIC_NAV } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { addBlockedDateAction, saveAvailabilityAction } from "@/app/actions/phase2";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import type { DayOfWeek } from "@prisma/client";
import Link from "next/link";

export const metadata = { title: "Schedule" };

const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default async function MechanicSchedulePage() {
  const session = await requireSession("MECHANIC");
  const profile = await prisma.mechanicProfile.findUniqueOrThrow({
    where: { userId: session.id },
    include: { availability: true, blockedDates: { orderBy: { date: "asc" } } },
  });
  const upcoming = await prisma.job.findMany({
    where: {
      mechanicProfileId: profile.id,
      scheduledAt: { gte: new Date() },
      status: { notIn: ["CANCELLED"] },
    },
    include: { customer: true, vehicle: { include: { make: true, model: true } } },
    orderBy: { scheduledAt: "asc" },
    take: 12,
  });
  const byDay = Object.fromEntries(profile.availability.map((item) => [item.dayOfWeek, item]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <AppNav items={MECHANIC_NAV} current="/mechanic/schedule" />
      <h1 className="text-3xl font-bold text-ink">Schedule</h1>
      <p className="mt-2 text-sm text-muted">Weekly hours customers can book. Blocked dates skip matching for that day.</p>

      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-ink">Weekly availability</h2>
        <form action={saveAvailabilityAction} className="mt-4 space-y-2">
          {DAYS.map((day) => {
            const current = byDay[day];
            return (
              <div key={day} className="grid grid-cols-[7rem_auto_1fr_1fr] items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name={`enabled_${day}`} defaultChecked={Boolean(current)} />
                  {day.slice(0, 3)}
                </label>
                <span className="text-muted">hours</span>
                <Input name={`start_${day}`} type="time" defaultValue={current?.startTime ?? "08:00"} />
                <Input name={`end_${day}`} type="time" defaultValue={current?.endTime ?? "18:00"} />
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

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-ink">Upcoming jobs</h2>
        <div className="mt-4 space-y-3">
          {upcoming.map((job) => (
            <Link key={job.id} href={`/mechanic/jobs/${job.id}`} className="block rounded-2xl border border-line bg-card p-4">
              <p className="font-semibold text-ink">
                {job.customer.firstName} {job.customer.lastName}
              </p>
              <p className="text-sm text-muted">
                {job.scheduledAt?.toLocaleString()} · {job.vehicle.year} {job.vehicle.make.name} {job.vehicle.model.name}
                {job.scheduledConfirmedAt ? " · confirmed" : " · awaiting confirmation"}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
