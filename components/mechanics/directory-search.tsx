"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, Car, ClipboardList, HelpCircle, MapPin, Play, Search, Wrench } from "lucide-react";
import { LANDING_LOCATION, VEHICLE_TYPES } from "@/lib/landing";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Tab = "shop" | "estimate" | "question";

export type DirectoryQuery = {
  q?: string;
  zip?: string;
  vehicle?: string;
  vehicleType?: string;
  category?: string;
  mode?: string;
  rating?: string;
  distance?: string;
  sort?: string;
};

export function DirectorySearchBar({ query }: { query: DirectoryQuery }) {
  const [tab, setTab] = useState<Tab>("shop");
  const action = tab === "question" ? "/sign-up" : "/mechanics";

  return (
    <form action={action} className="rounded-[28px] bg-[#102033] p-4 text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-5">
      <CommittedFilters query={query} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "shop"} onClick={() => setTab("shop")} icon={Search}>
            Find a Repair Shop
          </TabButton>
          <TabButton active={tab === "estimate"} onClick={() => setTab("estimate")} icon={ClipboardList}>
            Get an Estimate
          </TabButton>
          <TabButton active={tab === "question"} onClick={() => setTab("question")} icon={HelpCircle}>
            Ask a Question
          </TabButton>
        </div>
        <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          Need help? See how it works
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2f7bff] text-white">
            <Play className="h-3 w-3 fill-current" />
          </span>
        </Link>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.15fr_1.35fr_1fr_auto]">
        <DarkField label="Vehicle Type">
          <div className="relative">
            <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2f7bff]" />
            <select
              name="vehicleType"
              defaultValue={query.vehicleType ?? "truck"}
              className="h-12 w-full rounded-xl border-0 bg-white pl-10 pr-3 text-sm text-navy outline-none"
            >
              {VEHICLE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </DarkField>
        <DarkField label="Year / Make / Model">
          <input
            name="vehicle"
            defaultValue={query.vehicle ?? "2022 Ford F-250"}
            className="h-12 w-full rounded-xl border-0 bg-white px-3.5 text-sm text-navy outline-none"
          />
        </DarkField>
        <DarkField label="What needs repaired">
          <div className="relative">
            <Wrench className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2f7bff]" />
            <select
              name="category"
              defaultValue={query.category ?? "SUSPENSION"}
              className="h-12 w-full rounded-xl border-0 bg-white pl-10 pr-3 text-sm text-navy outline-none"
            >
              <option value="">Any service</option>
              <option value="SUSPENSION">Front-end work (suspension, steering, etc.)</option>
              {SERVICE_CATEGORIES.filter((item) => item.value !== "SUSPENSION").map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </DarkField>
        <DarkField label="Your Location">
          <div className="relative">
            <input
              name="zip"
              defaultValue={query.zip ?? LANDING_LOCATION}
              className="h-12 w-full rounded-xl border-0 bg-white px-3.5 pr-10 text-sm text-navy outline-none"
            />
            <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2f7bff]" />
          </div>
        </DarkField>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#2f7bff] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(47,123,255,0.35)] hover:bg-[#2568e8] lg:w-auto"
          >
            {tab === "question" ? "Ask a Question" : "Update Search"}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <DarkField label="Describe the issue (optional)">
          <input
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="Clunking noise from the front left when hitting bumps..."
            className="h-12 w-full rounded-xl border-0 bg-white px-3.5 text-sm text-navy outline-none placeholder:text-muted"
          />
        </DarkField>
        <div className="flex items-end">
          <label className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-navy">
            <Camera className="h-4 w-4 text-[#2f7bff]" />
            Add Photos / Video
            <input type="file" accept="image/*,video/*" multiple className="hidden" />
          </label>
        </div>
      </div>
    </form>
  );
}

function CommittedFilters({ query }: { query: DirectoryQuery }) {
  return (
    <>
      {query.mode ? <input type="hidden" name="mode" value={query.mode} /> : null}
      {query.rating ? <input type="hidden" name="rating" value={query.rating} /> : null}
      <input type="hidden" name="distance" value={query.distance ?? "50"} />
      <input type="hidden" name="sort" value={query.sort ?? "recommended"} />
    </>
  );
}

function DarkField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-white/80">{label}</span>
      {children}
    </label>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Search;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
        active ? "bg-[#2f7bff] text-white" : "bg-white/10 text-white hover:bg-white/15",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}
