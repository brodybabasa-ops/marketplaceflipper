"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { List, Map as MapIcon, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectoryShop } from "@/services/landing";

const CITIES = [
  { name: "Kaysville", top: "18%", left: "48%" },
  { name: "Layton", top: "42%", left: "44%" },
  { name: "Syracuse", top: "58%", left: "72%" },
  { name: "Hill AFB", top: "28%", left: "62%" },
];

export function DirectoryMap({
  shops,
  origin,
}: {
  shops: DirectoryShop[];
  origin: { latitude: number; longitude: number; city: string } | null;
}) {
  const [mode, setMode] = useState<"map" | "list">("map");
  const [active, setActive] = useState(shops[0]?.slug ?? "");
  const selected = shops.find((shop) => shop.slug === active) ?? shops[0];
  const pins = useMemo(() => projectPins(shops, origin), [shops, origin]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_30px_rgba(14,28,47,0.06)]">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="flex rounded-lg bg-paper p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setMode("map")}
            className={cn("inline-flex items-center gap-1 rounded-md px-3 py-1.5", mode === "map" ? "bg-white text-navy shadow-sm" : "text-muted")}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Map
          </button>
          <button
            type="button"
            onClick={() => setMode("list")}
            className={cn("inline-flex items-center gap-1 rounded-md px-3 py-1.5", mode === "list" ? "bg-white text-navy shadow-sm" : "text-muted")}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>
        <button type="submit" className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f7bff]">
          <Search className="h-3.5 w-3.5" />
          Search This Area
        </button>
      </div>
      {mode === "list" ? (
        <div className="max-h-[420px] space-y-2 overflow-y-auto p-3">
          {shops.slice(0, 8).map((shop) => (
            <Link key={shop.slug} href={`/mechanics/${shop.slug}`} className="block rounded-xl bg-paper px-3 py-2">
              <p className="text-sm font-semibold text-navy">{shop.businessName}</p>
              <p className="text-xs text-muted">
                {shop.averageRating.toFixed(1)} · {shop.distanceLabel} · {shop.city}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="relative h-[360px] overflow-hidden bg-[#d7e4ef]">
          <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(#c5d5e4_1px,transparent_1px),linear-gradient(90deg,#c5d5e4_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute inset-6 rounded-[40%] border border-white/70 bg-[#b9d0b8]/80" />
          <div className="absolute left-[8%] right-[18%] top-[18%] h-10 rounded-full bg-[#9ebdd4]/90" />
          <div className="absolute bottom-[22%] left-[20%] right-[12%] h-8 rounded-full bg-[#9ebdd4]/80" />
          {CITIES.map((city) => (
            <span key={city.name} className="absolute text-[11px] font-semibold text-[#3b5470]" style={{ top: city.top, left: city.left }}>
              {city.name}
            </span>
          ))}
          {pins.map((pin) => (
            <button
              key={pin.slug}
              type="button"
              onClick={() => setActive(pin.slug)}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{ left: pin.left, top: pin.top }}
              aria-label={pin.businessName}
            >
              <span className={cn("block h-7 w-5", pin.slug === selected?.slug ? "text-[#2f7bff]" : "text-[#1f4b8f]")}>
                <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current drop-shadow">
                  <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" />
                  <circle cx="12" cy="9" r="2.3" fill="white" />
                </svg>
              </span>
            </button>
          ))}
          {selected ? (
            <div className="absolute right-3 top-3 w-44 overflow-hidden rounded-xl bg-white shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.photo} alt="" className="h-16 w-full object-cover" />
              <div className="p-2">
                <p className="truncate text-sm font-bold text-navy">{selected.businessName}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {selected.averageRating.toFixed(1)} ({selected.reviewCount})
                </p>
                <p className="text-xs text-muted">
                  {selected.distanceLabel}
                  {selected.openNow ? " · Open Now" : ""}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function projectPins(shops: DirectoryShop[], origin: { latitude: number; longitude: number } | null) {
  const points = shops.slice(0, 12);
  if (!points.length) return [];
  const lats = points.map((shop) => shop.latitude);
  const lngs = points.map((shop) => shop.longitude);
  if (origin) {
    lats.push(origin.latitude);
    lngs.push(origin.longitude);
  }
  const minLat = Math.min(...lats) - 0.04;
  const maxLat = Math.max(...lats) + 0.04;
  const minLng = Math.min(...lngs) - 0.04;
  const maxLng = Math.max(...lngs) + 0.04;
  return points.map((shop) => ({
    ...shop,
    left: `${12 + ((shop.longitude - minLng) / Math.max(maxLng - minLng, 0.001)) * 76}%`,
    top: `${12 + ((maxLat - shop.latitude) / Math.max(maxLat - minLat, 0.001)) * 76}%`,
  }));
}
