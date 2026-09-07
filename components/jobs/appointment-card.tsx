import { confirmAppointmentAction, proposeAppointmentAction } from "@/app/actions/phase2";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AppointmentCard({
  jobId,
  scheduledAt,
  confirmedAt,
  canPropose,
}: {
  jobId: string;
  scheduledAt: Date | null;
  confirmedAt: Date | null;
  canPropose?: boolean;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-ink">Appointment</h2>
      {scheduledAt ? (
        <p className="mt-2 text-sm">
          {scheduledAt.toLocaleString()} {confirmedAt ? "· confirmed" : "· waiting for confirmation"}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">No time on the calendar yet.</p>
      )}
      {canPropose ? (
        <form action={proposeAppointmentAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="jobId" value={jobId} />
          <Input name="scheduledAt" type="datetime-local" required />
          <Button type="submit" size="sm">
            Propose time
          </Button>
        </form>
      ) : null}
      {scheduledAt && !confirmedAt ? (
        <form action={confirmAppointmentAction} className="mt-3">
          <input type="hidden" name="jobId" value={jobId} />
          <Button type="submit" variant="secondary" size="sm">
            Confirm appointment
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
