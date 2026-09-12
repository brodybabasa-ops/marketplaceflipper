import { updateJobStatusAction } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";

export function AcceptJobButton({
  jobId,
  label = "Accept",
  size = "sm",
}: {
  jobId: string;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <form action={updateJobStatusAction}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="status" value="ACCEPTED" />
      <Button type="submit" size={size}>
        {label}
      </Button>
    </form>
  );
}
