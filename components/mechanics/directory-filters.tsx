"use client";

import type { ComponentProps, FormEvent } from "react";
import { DIRECTORY_SERVICES } from "@/lib/landing";
import type { DirectoryQuery } from "@/components/mechanics/directory-search";

const AMENITIES = ["Loaner Vehicles", "Shuttle Service", "After Hours Drop-Off", "Financing Available", "Warranty on Repairs"];

export function AutoSubmitSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={className}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
    >
      {children}
    </select>
  );
}

export function DirectoryFilters({ query }: { query: DirectoryQuery }) {
  function submit(event: FormEvent<HTMLInputElement | HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <aside className="rounded-2xl bg-[#102033] p-4 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Filters</h2>
        <a href="/mechanics?zip=Layton%2C%20UT" className="text-xs font-semibold text-[#7eb0ff]">
          Clear all
        </a>
      </div>

      <section className="mt-5">
        <p className="text-sm font-semibold">Distance</p>
        <p className="mt-1 text-xs text-white/60">Within {query.distance ?? "50"} miles</p>
        <input
          type="range"
          name="distance"
          min={5}
          max={100}
          step={5}
          defaultValue={query.distance ?? "50"}
          onMouseUp={submit}
          onTouchEnd={submit}
          className="mt-3 w-full accent-[#2f7bff]"
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/40">
          <span>5</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-sm font-semibold">Shop Type</p>
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="" defaultChecked={!query.mode} onChange={submit} className="accent-[#2f7bff]" />
            All Shops
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="DEALERSHIP" defaultChecked={query.mode === "DEALERSHIP"} onChange={submit} className="accent-[#2f7bff]" />
            Dealerships
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="SHOP" defaultChecked={query.mode === "SHOP"} onChange={submit} className="accent-[#2f7bff]" />
            Independent Shops
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="MOBILE" defaultChecked={query.mode === "MOBILE"} onChange={submit} className="accent-[#2f7bff]" />
            Mobile Mechanics
          </label>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-sm font-semibold">Services</p>
        <div className="mt-3 space-y-2 text-sm">
          {DIRECTORY_SERVICES.map((item) => (
            <label key={item.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="serviceFilter"
                value={item.value}
                defaultChecked={query.category === item.value}
                onChange={(event) => {
                  const select = event.currentTarget.form?.elements.namedItem("category");
                  if (select instanceof HTMLSelectElement) select.value = event.currentTarget.value;
                  event.currentTarget.form?.requestSubmit();
                }}
                className="accent-[#2f7bff]"
              />
              {item.label}
            </label>
          ))}
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="serviceFilter"
              value=""
              defaultChecked={!query.category}
              onChange={(event) => {
                const select = event.currentTarget.form?.elements.namedItem("category");
                if (select instanceof HTMLSelectElement) select.value = "";
                event.currentTarget.form?.requestSubmit();
              }}
              className="accent-[#2f7bff]"
            />
            Any service
          </label>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-sm font-semibold">Ratings</p>
        <div className="mt-3 space-y-2 text-sm">
          {[
            { value: "4.5", label: "4.5+ ★" },
            { value: "4", label: "4+ ★" },
            { value: "3", label: "3+ ★" },
          ].map((item) => (
            <label key={item.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="rating"
                value={item.value}
                defaultChecked={query.rating === item.value}
                onChange={submit}
                className="accent-[#2f7bff]"
              />
              {item.label}
            </label>
          ))}
          <label className="flex items-center gap-2">
            <input type="radio" name="rating" value="" defaultChecked={!query.rating} onChange={submit} className="accent-[#2f7bff]" />
            Any rating
          </label>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-sm font-semibold">Amenities</p>
        <p className="mt-1 text-[11px] text-white/45">Not in the current directory — these do not filter results.</p>
        <div className="mt-3 space-y-2 text-sm text-white/45">
          {AMENITIES.map((item) => (
            <label key={item} className="flex items-center gap-2">
              <input type="checkbox" disabled className="accent-[#2f7bff]" />
              {item}
            </label>
          ))}
        </div>
      </section>
    </aside>
  );
}
