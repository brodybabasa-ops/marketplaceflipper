"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectoryShop } from "@/services/landing";

const BOUNDS = { minLat: 40.95, maxLat: 41.2, minLng: -112.18, maxLng: -111.82 };

export function CustomerMap({
  shops,
  origin,
  compact,
  mapHref = "?view=map",
}: {
  shops: DirectoryShop[];
  origin: { latitude: number; longitude: number; city: string } | null;
  compact?: boolean;
  mapHref?: string;
}) {
  const [active, setActive] = useState(shops[0]?.slug ?? "");
  const selected = shops.find((shop) => shop.slug === active) ?? shops[0];
  const pins = useMemo(
    () => shops.slice(0, 12).map((shop) => ({ ...shop, ...project(shop.latitude, shop.longitude) })),
    [shops],
  );
  const here = origin ? project(origin.latitude, origin.longitude) : null;

  if (compact) {
    return (
      <Link
        href={mapHref}
        className="relative block h-[72px] w-[118px] overflow-hidden rounded-xl border border-white/10 bg-[#12324a]"
      >
        <MapBackdrop />
        {here ? (
          <span
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2f7bff] ring-4 ring-[#2f7bff]/30"
            style={{ top: here.top, left: here.left }}
          />
        ) : null}
        {pins.map((pin) => (
          <span
            key={pin.slug}
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7eb0ff]"
            style={{ left: pin.left, top: pin.top }}
          />
        ))}
        <span className="absolute bottom-1.5 right-1.5 rounded-full bg-[#071422]/85 px-2 py-0.5 text-[10px] font-bold text-white">
          View Map
        </span>
      </Link>
    );
  }

  return (
    <div className="relative h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#12324a]">
      <MapBackdrop />
      {here ? (
        <span
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2f7bff] ring-4 ring-[#2f7bff]/30"
          style={{ top: here.top, left: here.left }}
        />
      ) : null}
      {pins.map((pin) => (
        <button
          key={pin.slug}
          type="button"
          onClick={() => setActive(pin.slug)}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: pin.left, top: pin.top }}
          aria-label={pin.businessName}
        >
          <svg viewBox="0 0 24 24" className={cn("h-7 w-7 drop-shadow", pin.slug === selected?.slug ? "fill-[#2f7bff]" : "fill-[#7eb0ff]")}>
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" />
            <circle cx="12" cy="9" r="2.3" fill="white" />
          </svg>
        </button>
      ))}
      {selected ? (
        <Link href={`/mechanics/${selected.slug}`} className="absolute right-3 top-3 w-40 overflow-hidden rounded-xl bg-[#071422]/90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.photo} alt="" className="h-14 w-full object-cover" />
          <span className="block p-2">
            <span className="block truncate text-xs font-bold text-white">{selected.businessName}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[10px] text-white/60">
              <Star className="h-3 w-3 fill-[#f5c451] text-[#f5c451]" />
              {selected.averageRating.toFixed(1)} · {selected.distanceLabel}
            </span>
          </span>
        </Link>
      ) : null}
    </div>
  );
}

function MapBackdrop() {
  return (
    <svg viewBox="0 0 300 280" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="300" height="280" fill="#1a3d52" />
      <path d="M0 40 C40 80 30 140 18 200 C8 240 20 260 0 280 L0 40Z" fill="#2f6f88" />
      <path d="M70 0 C90 80 110 140 118 220 C124 250 140 270 150 280" fill="none" stroke="#2a4d63" strokeWidth="14" />
      <path d="M40 180 H300" fill="none" stroke="#2a4d63" strokeWidth="7" />
      <circle cx="128" cy="140" r="18" fill="#24485c" />
      <circle cx="168" cy="180" r="22" fill="#24485c" />
    </svg>
  );
}

function project(lat: number, lng: number) {
  const left = 8 + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 84;
  const top = 8 + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 84;
  return { left: `${Math.min(92, Math.max(8, left))}%`, top: `${Math.min(92, Math.max(8, top))}%` };
}
