import Link from "next/link";
import { Calendar, MessageSquare, MoreHorizontal, Plus } from "lucide-react";
import {
  AppCard,
  AppPageHeader,
  FilterTabs,
  GhostCta,
  SearchSortBar,
  VerifiedMark,
} from "@/components/customer-app/primitives";
import { SaveHeart } from "@/components/customer-app/shop-card";
import { shopKind, shopKindLabel } from "@/lib/shop-kind";
import type { DirectoryShop } from "@/services/landing";
import { Star } from "lucide-react";

export type SavedShopRow = DirectoryShop & {
  savedAt: Date;
  tagline?: string | null;
  serviceLabel: string;
};

export function CustomerSavedView({
  shops,
  kind,
  q,
  sort,
}: {
  shops: SavedShopRow[];
  kind: string;
  q: string;
  sort: string;
}) {
  const active = kind || "all";
  const counts = {
    all: shops.length,
    auto: shops.filter((shop) => shopKind(shop) === "auto").length,
    marine: shops.filter((shop) => shopKind(shop) === "marine").length,
    powersports: shops.filter((shop) => shopKind(shop) === "powersports").length,
    other: shops.filter((shop) => !["auto", "marine", "powersports"].includes(shopKind(shop))).length,
  };
  let visible =
    active === "all"
      ? shops
      : active === "other"
        ? shops.filter((shop) => !["auto", "marine", "powersports"].includes(shopKind(shop)))
        : shops.filter((shop) => shopKind(shop) === active);
  if (q) {
    const needle = q.toLowerCase();
    visible = visible.filter((shop) => shop.businessName.toLowerCase().includes(needle) || shop.city.toLowerCase().includes(needle));
  }
  if (sort === "az") visible = [...visible].sort((a, b) => a.businessName.localeCompare(b.businessName));
  if (sort === "distance") visible = [...visible].sort((a, b) => a.distanceMiles - b.distanceMiles);
  if (sort === "rating") visible = [...visible].sort((a, b) => b.averageRating - a.averageRating);

  return (
    <div className="px-4 pt-2">
      <AppPageHeader
        title="Saved Shops"
        subtitle="Your trusted shops, all in one place."
        action={
          <Link href="/mechanics" className="inline-flex h-9 items-center gap-1 rounded-full bg-[#2f7bff] px-3 text-sm font-bold text-white">
            <Plus className="h-4 w-4" /> Find More Shops
          </Link>
        }
      />
      <FilterTabs
        param="kind"
        extra={{ q, sort: sort !== "recent" ? sort : undefined }}
        value={active}
        tabs={[
          { id: "all", label: "All", count: counts.all },
          { id: "auto", label: "Auto", count: counts.auto },
          { id: "marine", label: "Marine", count: counts.marine },
          { id: "powersports", label: "Powersports", count: counts.powersports },
          { id: "other", label: "Other", count: counts.other },
        ]}
      />
      <SearchSortBar
        action="/saved"
        searchPlaceholder="Search your saved shops..."
        searchDefault={q}
        sortDefault={sort}
        sortOptions={[
          { value: "recent", label: "Recently Added" },
          { value: "az", label: "A–Z" },
          { value: "distance", label: "Distance" },
          { value: "rating", label: "Highest rated" },
        ]}
        hidden={{ ...(active !== "all" ? { kind: active } : {}) }}
      />
      <div className="mt-4 space-y-3">
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#0c1d30] p-5 text-sm text-white/55">
            Save a shop from Find a Shop to keep it here.
          </p>
        ) : (
          visible.map((shop) => (
            <AppCard key={shop.id} className="p-3">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shop.photo} alt="" className="h-[72px] w-[88px] shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-white">
                        {shop.businessName}
                        {shop.verified ? <VerifiedMark /> : null}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-white/55">
                        <Star className="h-3 w-3 fill-[#f5c451] text-[#f5c451]" />
                        {shop.averageRating.toFixed(1)} ({shop.reviewCount} reviews)
                        <span className="ml-1 rounded-full bg-[#2f7bff]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#7eb0ff]">Verified</span>
                      </p>
                    </div>
                    <SaveHeart id={shop.id} slug={shop.slug} saved returnTo="/saved" />
                  </div>
                  <p className="mt-1 text-[11px] text-white/45">
                    {shopKindLabel(shopKind(shop))} · {shop.serviceLabel} · {shop.city}, {shop.state} · {shop.distanceLabel}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-white/40">{shop.tagline || shop.specialties.join(", ")}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                <Link href={`/messages/start?shop=${shop.id}`} className={chip()}>
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Link>
                <Link href={`/request?mechanic=${shop.id}`} className={chip()}>
                  <Calendar className="h-3.5 w-3.5" /> Book
                </Link>
                <Link href={`/request?mechanic=${shop.id}`} className={chip()}>
                  Get Estimate
                </Link>
                <Link href={`/mechanics/${shop.slug}`} className={chip()}>
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Link>
              </div>
            </AppCard>
          ))
        )}
      </div>
      <div className="mt-4">
        <GhostCta href="/mechanics" icon={<Calendar className="h-5 w-5" />} title="Discover More Shops" body="Find and save more trusted shops near you." />
      </div>
    </div>
  );
}

function chip() {
  return "inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#071422] text-[11px] font-semibold text-white";
}
