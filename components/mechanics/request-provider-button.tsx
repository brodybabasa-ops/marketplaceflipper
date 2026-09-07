import { Button } from "@/components/ui/button";
import { assignMechanicToRequestAction } from "@/app/actions/marketplace";

export function RequestProviderButton({
  requestId,
  mechanicProfileId,
  label = "Request this provider",
}: {
  requestId: string;
  mechanicProfileId: string;
  label?: string;
}) {
  return (
    <form action={assignMechanicToRequestAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="mechanicProfileId" value={mechanicProfileId} />
      <Button type="submit">{label}</Button>
    </form>
  );
}
