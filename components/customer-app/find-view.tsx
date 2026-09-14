import Link from "next/link";
import { List, Map as MapIcon, Search, Wrench, X } from "lucide-react";
import { AppPageHeader } from "@/components/customer-app/primitives";
import { CustomerMap } from "@/components/customer-app/map";
import { FindShopCard } from "@/components/customer-app/shop-card";
import { shopMatchesType } from "@/lib/shop-kind";
import { cn } from "@/lib/utils";
import { AutoSubmitSelect } from "@/components/customer-app/auto-submit-select";
import type { DirectoryShop } from "@/services/landing";

const TYPES = [
  { id: "all", label: "All" },
  { id: "auto", label: "Auto" },
  { id: "marine", label: "Marine" },
  { id: "powersports", label: "Powersports" },
  { id: "rv", label: "RV" },
  { id: "mobile", label: "Mobile" },
];

export type FindQuery = {
  q?: string;
  zip?: string;
  type?: string;
  category?: string;
  distance?: string;
  rating?: string;
  sort?: string;
  view?: string;
};

export function CustomerFindView({
  query,
  shops,
  savedIds,
  origin,
  locationLabel,
}: {
  query: FindQuery;
  shops: DirectoryShop[];
  savedIds: string[];
  origin: { latitude: number; longitude: number; city: string } | null;
  locationLabel: string;
}) {
  const type = query.type ?? "all";
  const view = query.view === "map" ? "map" : "list";
  const visible = shops.filter((shop) => shopMatchesType(shop, type));
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.zip) params.set("zip", query.zip);
  if (query.category) params.set("category", query.category);
  if (query.distance) params.set("distance", query.distance);
  if (query.rating) params.set("rating", query.rating);
  if (query.sort) params.set("sort", query.sort);
  if (type !== "all") params.set("type", type);

  function hrefWith(next: Record<string, string | undefined>) {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (!value) merged.delete(key);
      else merged.set(key, value);
    }
    const s = merged.toString();
    return s ? `/mechanics?${s}` : "/mechanics";
  }

  return (
    <div className="px-4 pt-2">
      <AppPageHeader title="Find a Shop" subtitle="Compare trusted repair shops near you." />
      <form action="/mechanics" className="relative">
        {query.zip ? <input type="hidden" name="zip" value={query.zip} /> : null}
        {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          name="q"
          defaultValue={query.q}
          placeholder="Search by issue or service"
          className="h-11 w-full rounded-full border border-white/10 bg-[#0c1d30] pl-10 pr-10 text-sm text-white outline-none placeholder:text-white/35"
        />
        {query.q ? (
          <Link
            href={hrefWith({ q: undefined })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Link>
        ) : null}
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TYPES.map((item) => (
          <Link
            key={item.id}
            href={hrefWith({ type: item.id === "all" ? undefined : item.id, view })}
            className={cn(
              "inline-flex shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold",
              type === item.id ? "bg-[#2f7bff] text-white" : "border border-white/10 bg-[#0c1d30] text-white/70",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <form action="/mechanics" className="mt-3 grid grid-cols-4 gap-2">
        {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
        {query.zip ? <input type="hidden" name="zip" value={query.zip} /> : null}
        {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
        {view === "map" ? <input type="hidden" name="view" value="map" /> : null}
        <AutoSubmitSelect name="category" defaultValue={query.category ?? ""} className="h-9 w-full rounded-full border border-white/10 bg-[#0c1d30] px-2 text-[11px] font-semibold text-white outline-none">
          <option value="">Service</option>
          <option value="DIAGNOSTICS">Diagnostics</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="SUSPENSION">Suspension</option>
          <option value="BRAKES">Brakes</option>
          <option value="ENGINE">Engine</option>
          <option value="ELECTRICAL">Electrical</option>
        </AutoSubmitSelect>
        <AutoSubmitSelect name="distance" defaultValue={query.distance ?? "50"} className="h-9 w-full rounded-full border border-white/10 bg-[#0c1d30] px-2 text-[11px] font-semibold text-white outline-none">
          <option value="10">10 mi</option>
          <option value="25">25 mi</option>
          <option value="50">Distance</option>
          <option value="100">100 mi</option>
        </AutoSubmitSelect>
        <AutoSubmitSelect name="rating" defaultValue={query.rating ?? ""} className="h-9 w-full rounded-full border border-white/10 bg-[#0c1d30] px-2 text-[11px] font-semibold text-white outline-none">
          <option value="">Rating</option>
          <option value="4">4.0+</option>
          <option value="4.5">4.5+</option>
          <option value="4.8">4.8+</option>
        </AutoSubmitSelect>
        <AutoSubmitSelect name="sort" defaultValue={query.sort ?? "closest"} className="h-9 w-full rounded-full border border-white/10 bg-[#0c1d30] px-2 text-[11px] font-semibold text-white outline-none">
          <option value="closest">Sort</option>
          <option value="rating">Top rated</option>
          <option value="recommended">Recommended</option>
        </AutoSubmitSelect>
      </form>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex rounded-full border border-white/10 bg-[#0c1d30] p-1">
          <Link
            href={hrefWith({ view: undefined })}
            className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold", view === "list" ? "bg-[#2f7bff] text-white" : "text-white/55")}
          >
            <List className="h-3.5 w-3.5" /> List
          </Link>
          <Link
            href={hrefWith({ view: "map" })}
            className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold", view === "map" ? "bg-[#2f7bff] text-white" : "text-white/55")}
          >
            <MapIcon className="h-3.5 w-3.5" /> Map
          </Link>
        </div>
        {view === "list" ? <CustomerMap shops={visible} origin={origin} compact mapHref={hrefWith({ view: "map" })} /> : null}
      </div>

      {view === "map" ? (
        <div className="mt-3">
          <CustomerMap shops={visible} origin={origin} />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-[#0c1d30] p-5 text-sm text-white/55">
              No shops matched {locationLabel}. Try a wider distance or another vehicle type.
            </p>
          ) : (
            visible.map((shop) => (
              <FindShopCard key={shop.id} shop={shop} saved={savedIds.includes(shop.id)} returnTo="/mechanics" />
            ))
          )}
        </div>
      )}

      <Link
        href="/request"
        className="mt-4 mb-2 flex items-center gap-3 rounded-[22px] border border-[#2f7bff]/35 bg-[#102a4a] p-4"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2f7bff]/20 text-[#2f7bff]">
          <Wrench className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-white">Not sure which shop is right?</span>
          <span className="block text-xs text-white/50">Tell us about your issue and we&apos;ll match you with the best shops near you.</span>
        </span>
        <span className="inline-flex max-w-[112px] shrink-0 items-center justify-center rounded-full bg-[#2f7bff] px-3 py-2 text-center text-[11px] font-bold leading-tight text-white">
          Let Pocket Mechanic Match You
        </span>
      </Link>
    </div>
  );
}

