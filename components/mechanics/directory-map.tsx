"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { List, Map as MapIcon, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectoryShop } from "@/services/landing";

const CITIES = [
  { name: "Kaysville", lat: 41.035, lng: -111.939 },
  { name: "Layton", lat: 41.06, lng: -111.971 },
  { name: "Syracuse", lat: 41.089, lng: -112.065 },
  { name: "Hill AFB", lat: 41.124, lng: -111.973 },
];

const BOUNDS = { minLat: 40.95, maxLat: 41.2, minLng: -112.18, maxLng: -111.82 };

export function DirectoryMap({
  shops,
  origin,
  compact,
  hideCities,
}: {
  shops: DirectoryShop[];
  origin: { latitude: number; longitude: number; city: string } | null;
  compact?: boolean;
  hideCities?: boolean;
}) {
  const [mode, setMode] = useState<"map" | "list">("map");
  const [active, setActive] = useState(shops[0]?.slug ?? "");
  const selected = shops.find((shop) => shop.slug === active) ?? shops[0];
  const pins = useMemo(() => shops.slice(0, 12).map((shop) => ({ ...shop, ...project(shop.latitude, shop.longitude) })), [shops]);
  const here = origin ? project(origin.latitude, origin.longitude) : null;

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
        {compact ? (
          <Link href="/mechanics" className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f7bff]">
            <Search className="h-3.5 w-3.5" />
            Search This Area
          </Link>
        ) : (
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-full border border-[#2f7bff]/30 px-3 py-1.5 text-xs font-semibold text-[#2f7bff]"
          >
            <Search className="h-3.5 w-3.5" />
            Search This Area
          </button>
        )}
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
        <div className={compact ? "relative h-[210px] overflow-hidden bg-[#dce8d4]" : "relative h-[360px] overflow-hidden bg-[#dce8d4]"}>
          <MapBackdrop />
          {hideCities
            ? null
            : CITIES.map((city) => {
            const point = project(city.lat, city.lng);
            return (
              <span
                key={city.name}
                className="absolute -translate-x-1/2 text-[11px] font-semibold text-[#3b5470] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]"
                style={{ top: point.top, left: point.left }}
              >
                {city.name}
              </span>
            );
          })}
          {here ? (
            <span
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2f7bff] ring-4 ring-[#2f7bff]/25"
              style={{ top: here.top, left: here.left }}
              aria-label={`Search origin: ${origin?.city}`}
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

function MapBackdrop() {
  return (
    <svg viewBox="0 0 300 360" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="lake" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#8ebfd4" />
          <stop offset="100%" stopColor="#6ea7c2" />
        </linearGradient>
      </defs>
      <rect width="300" height="360" fill="#e7e1d1" />
      <path d="M0 40 C40 80 30 140 18 200 C8 260 20 310 0 360 L0 40Z" fill="url(#lake)" />
      <path d="M0 90 C55 120 48 175 22 230 C10 265 18 310 0 340" fill="#7eb3cc" opacity="0.7" />
      <ellipse cx="38" cy="168" rx="18" ry="42" fill="#cbbd9a" />
      <path d="M70 0 C90 80 110 140 118 220 C124 280 140 330 150 360" fill="none" stroke="#f3eee2" strokeWidth="14" />
      <path d="M70 0 C90 80 110 140 118 220 C124 280 140 330 150 360" fill="none" stroke="#d9d1bf" strokeWidth="2" />
      <path d="M160 20 C180 90 200 160 210 240 C218 300 240 340 250 360" fill="none" stroke="#f7f2e6" strokeWidth="8" />
      <path d="M40 210 H300" fill="none" stroke="#f3eee2" strokeWidth="7" />
      <path d="M90 80 H280" fill="none" stroke="#efe8d8" strokeWidth="5" />
      <circle cx="128" cy="168" r="18" fill="#dfe8d6" />
      <circle cx="168" cy="210" r="22" fill="#e4ddc8" />
      <text x="8" y="150" fill="#4d6a80" fontSize="9" fontWeight="600">
        Antelope Island
      </text>
    </svg>
  );
}

function project(lat: number, lng: number) {
  const left = 8 + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 84;
  const top = 8 + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 84;
  return { left: `${Math.min(92, Math.max(8, left))}%`, top: `${Math.min(92, Math.max(8, top))}%` };
}

