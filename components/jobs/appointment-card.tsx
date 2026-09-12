import { scheduleAppointmentAction } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import {
  formatAppointmentDate,
  formatDenverDateInput,
  formatDenverTimeInput,
  timeWindowToClock,
} from "@/lib/datetime";
import { formatAppointment } from "@/lib/utils";

export function AppointmentCard({
  jobId,
  scheduledAt,
  preferredDate,
  preferredTimeWindow,
  canEdit,
  calendarHref,
  surface = "customer",
}: {
  jobId: string;
  scheduledAt: Date | null;
  preferredDate: Date | null;
  preferredTimeWindow: string | null;
  canEdit: boolean;
  calendarHref?: string;
  surface?: "customer" | "shop";
}) {
  const defaultDate = scheduledAt
    ? formatDenverDateInput(scheduledAt)
    : preferredDate
      ? formatDenverDateInput(preferredDate)
      : "";
  const defaultTime = scheduledAt
    ? formatDenverTimeInput(scheduledAt)
    : timeWindowToClock(preferredTimeWindow);
  const preferredLabel = preferredDate
    ? `${formatAppointmentDate(preferredDate)}${preferredTimeWindow ? ` · ${preferredTimeWindow}` : ""}`
    : preferredTimeWindow;

  return (
    <Card
      className={surface === "shop" ? "border-0 p-5" : "border-0 bg-[#f7f9fc] p-5 shadow-none"}
      id="appointment"
    >
      <h2 className="font-semibold text-navy">Appointment</h2>
      {scheduledAt ? (
        <p className="mt-2 text-lg font-semibold text-navy">{formatAppointment(scheduledAt)}</p>
      ) : (
        <p className="mt-2 text-sm text-muted">No time on the job record yet.</p>
      )}
      {preferredLabel && !scheduledAt ? (
        <p className="mt-1 text-sm text-muted">Requested: {preferredLabel}</p>
      ) : null}
      {canEdit ? (
        <form action={scheduleAppointmentAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="jobId" value={jobId} />
          <Field label="Date">
            <Input name="date" type="date" required defaultValue={defaultDate} />
          </Field>
          <Field label="Time">
            <Input name="time" type="time" required defaultValue={defaultTime} />
          </Field>
          <Button type="submit">{scheduledAt ? "Update time" : "Set time"}</Button>
        </form>
      ) : null}
      {scheduledAt && calendarHref ? (
        <a href={calendarHref} className="mt-3 inline-block text-sm font-semibold text-[#2f7bff]">
          Add to calendar
        </a>
      ) : null}
    </Card>
  );
}
