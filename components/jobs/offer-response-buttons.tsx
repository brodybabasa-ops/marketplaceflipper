import { acceptRequestOfferAction, declineRequestOfferAction } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";

export function OfferResponseButtons({ offerId }: { offerId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={acceptRequestOfferAction}>
        <input type="hidden" name="offerId" value={offerId} />
        <Button type="submit" size="sm" name="acceptRequest">
          Accept request
        </Button>
      </form>
      <form action={declineRequestOfferAction}>
        <input type="hidden" name="offerId" value={offerId} />
        <Button type="submit" size="sm" variant="secondary" name="declineRequest">
          Decline
        </Button>
      </form>
    </div>
  );
}
