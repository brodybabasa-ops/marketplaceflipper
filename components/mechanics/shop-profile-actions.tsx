import Link from "next/link";
import { Button } from "@/components/ui/button";
import { startShopThreadAction, toggleSavedShopAction } from "@/app/actions/marketplace";

export function ShopProfileActions({
  mechanicId,
  slug,
  isOwner,
  isCustomer,
  saved,
}: {
  mechanicId: string;
  slug: string;
  isOwner: boolean;
  isCustomer: boolean;
  saved: boolean;
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Button asChild>
        <Link href={`/request?mechanic=${mechanicId}`}>Request Service</Link>
      </Button>
      {isOwner ? (
        <Button asChild variant="secondary">
          <Link href="/mechanic/profile">Edit profile</Link>
        </Button>
      ) : (
        <form action={startShopThreadAction}>
          <input type="hidden" name="mechanicProfileId" value={mechanicId} />
          <input type="hidden" name="slug" value={slug} />
          <Button type="submit" variant="secondary" name="messageShop">
            Message
          </Button>
        </form>
      )}
      {isOwner ? null : (
        <form action={toggleSavedShopAction}>
          <input type="hidden" name="mechanicProfileId" value={mechanicId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="returnTo" value={`/mechanics/${slug}`} />
          <Button type="submit" variant="secondary" name="saveShop">
            {isCustomer && saved ? "Saved" : "Save shop"}
          </Button>
        </form>
      )}
    </div>
  );
}
