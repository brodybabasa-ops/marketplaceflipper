import { Heart, Star } from "lucide-react";
import Link from "next/link";
import { toggleSavedShopAction } from "@/app/actions/marketplace";
import { AppCard, OutlineButton, PrimaryButton, VerifiedMark } from "@/components/customer-app/primitives";
import { availableChip, shopKind, shopPrimaryAction } from "@/lib/shop-kind";
import { cn } from "@/lib/utils";
import type { DirectoryShop } from "@/services/landing";

export function FindShopCard({
  shop,
  saved,
  returnTo = "/mechanics",
}: {
  shop: DirectoryShop;
  saved?: boolean;
  returnTo?: string;
}) {
  const kind = shopKind(shop);
  const action = shopPrimaryAction(kind);
  const available = availableChip(shop.availabilityLabel, shop.openNow);
  return (
    <AppCard className="p-3">
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shop.photo} alt="" className="h-[92px] w-[92px] shrink-0 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-white">
                <span className="truncate">{shop.businessName}</span>
                {shop.verified ? <VerifiedMark /> : null}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-white/60">
                <Star className="h-3 w-3 fill-[#f5c451] text-[#f5c451]" />
                <span className="font-semibold text-white">{shop.averageRating.toFixed(1)}</span>
                <span>({shop.reviewCount} reviews)</span>
              </p>
              <p className="mt-0.5 text-xs text-white/45">
                {shop.distanceLabel} · {shop.city}, {shop.state}
              </p>
            </div>
            <SaveHeart id={shop.id} slug={shop.slug} saved={saved} returnTo={returnTo} />
          </div>
          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {shop.specialties.slice(0, 4).map((chip) => (
                <span key={chip} className="rounded-full bg-[#2f7bff]/15 px-2 py-0.5 text-[10px] font-semibold text-[#7eb0ff]">
                  {chip}
                </span>
              ))}
            </div>
            <span className="shrink-0 pt-0.5 text-[11px] font-semibold text-[#3ee08f]">{available}</span>
          </div>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-xs text-white/50">
        {shop.tagline || shop.specialties.join(" · ") || "Trusted local repair."}
      </p>
      <div className="mt-3 flex gap-2">
        <OutlineButton href={`/mechanics/${shop.slug}`}>View Shop</OutlineButton>
        <PrimaryButton href={`/request?mechanic=${shop.id}`}>{action}</PrimaryButton>
      </div>
    </AppCard>
  );
}

export function HomeShopCard({ shop, saved }: { shop: DirectoryShop; saved?: boolean }) {
  return (
    <AppCard className="w-[168px] shrink-0 p-0">
      <div className="relative">
        <Link href={`/mechanics/${shop.slug}`} className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shop.photo} alt="" className="h-[96px] w-full rounded-t-[22px] object-cover" />
        </Link>
        <div className="absolute right-2 top-2">
          <SaveHeart id={shop.id} slug={shop.slug} saved={saved} returnTo="/home" className="bg-[#071422]/70" />
        </div>
      </div>
      <Link href={`/mechanics/${shop.slug}`} className="block p-3">
        <p className="flex items-center gap-1 text-sm font-extrabold text-white">
          <span className="truncate">{shop.businessName}</span>
          {shop.verified ? <VerifiedMark /> : null}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/55">
          <Star className="h-3 w-3 fill-[#f5c451] text-[#f5c451]" />
          {shop.averageRating.toFixed(1)} ({shop.reviewCount})
          <span className="text-white/35">· {shop.distanceLabel}</span>
        </p>
        <p className="mt-1 line-clamp-1 text-[11px] text-white/45">{shop.specialties.slice(0, 3).join(" · ")}</p>
        <p className="mt-1 text-[11px] font-semibold text-[#3ee08f]">Next opening: {shop.availabilityLabel}</p>
        <span className="mt-2 inline-flex text-sm font-semibold text-[#7eb0ff]">View Shop →</span>
      </Link>
    </AppCard>
  );
}

export function SaveHeart({
  id,
  slug,
  saved,
  returnTo,
  className,
}: {
  id: string;
  slug: string;
  saved?: boolean;
  returnTo: string;
  className?: string;
}) {
  return (
    <form action={toggleSavedShopAction}>
      <input type="hidden" name="mechanicProfileId" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        name="saveShop"
        className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5", className)}
        aria-label={saved ? "Unsave shop" : "Save shop"}
      >
        <Heart className={cn("h-4 w-4", saved ? "fill-[#ff4d6d] text-[#ff4d6d]" : "text-white/55")} />
      </button>
    </form>
  );
}
